import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, repositoriesTable, chatMessagesTable, learningPathsTable, architecturesTable } from "@workspace/db";
import {
  AnalyzeRepositoryBody,
  GetRepositoryParams,
  DeleteRepositoryParams,
  GetRepositorySummaryParams,
  GetRepositoryFilesParams,
  GetRepositoryStatsParams,
  ListChatMessagesParams,
  SendChatMessageParams,
  SendChatMessageBody,
  GenerateLearningPathParams,
  GenerateLearningPathBody,
  GetLearningPathParams,
  GetArchitectureParams,
  ClearChatHistoryParams,
  GetHealthScoreParams,
  GetHealthScoreQueryParams,
  ReanalyzeRepositoryParams,
} from "@workspace/api-zod";
import { parseGitLabUrl, fetchProject, fetchRepositoryTree, fetchLanguages } from "../../lib/gitlab";
import { openai } from "../../lib/openai";
import {
  buildRepositoryAnalysisPrompt,
  buildChatSystemPrompt,
  buildLearningPathPrompt,
  buildArchitecturePrompt,
  buildHealthScorePrompt,
} from "../../lib/ai-prompts";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

function buildFileTree(items: Array<{ name: string; path: string; type: string }>): string {
  return items
    .slice(0, 200)
    .map((item) => `${item.type === "tree" ? "[dir]" : "[file]"} ${item.path}`)
    .join("\n");
}

function buildFileTreeNodes(items: Array<{ name: string; path: string; type: string }>): unknown[] {
  const map: Record<string, { name: string; path: string; type: string; children: unknown[] }> = {};
  const roots: unknown[] = [];

  for (const item of items.slice(0, 300)) {
    const node = { name: item.name, path: item.path, type: item.type === "tree" ? "directory" : "file", children: [] };
    map[item.path] = node;
    const parentPath = item.path.includes("/") ? item.path.substring(0, item.path.lastIndexOf("/")) : null;
    if (parentPath && map[parentPath]) {
      map[parentPath].children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

router.get("/repositories", async (_req, res): Promise<void> => {
  const repos = await db.select().from(repositoriesTable).orderBy(desc(repositoriesTable.updatedAt));
  res.json(repos.map((r) => {
    const raw = r.rawData as Record<string, unknown> | null;
    return {
      id: r.id,
      name: r.name,
      url: r.url,
      namespace: r.namespace,
      description: r.description,
      defaultBranch: r.defaultBranch,
      status: r.status,
      language: r.language,
      starCount: r.starCount,
      forksCount: r.forksCount,
      errorMessage: r.status === "error" ? (raw?.errorMessage as string | null) ?? null : null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }));
});

router.post("/repositories", async (req, res): Promise<void> => {
  const parsed = AnalyzeRepositoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { url } = parsed.data;
  const urlInfo = parseGitLabUrl(url);
  if (!urlInfo) {
    res.status(400).json({ error: "Invalid GitLab URL. Expected format: https://gitlab.com/namespace/project" });
    return;
  }

  const project = await fetchProject(urlInfo.projectPath);
  if (!project) {
    res.status(400).json({ error: "Could not access GitLab repository. Check the URL and that your token has read_api scope." });
    return;
  }

  const [repo] = await db.insert(repositoriesTable).values({
    name: project.name,
    url: project.web_url,
    namespace: project.path_with_namespace.split("/").slice(0, -1).join("/"),
    description: project.description,
    defaultBranch: project.default_branch || "main",
    status: "analyzing",
    starCount: project.star_count,
    forksCount: project.forks_count,
  }).returning();

  res.status(201).json({
    id: repo.id,
    name: repo.name,
    url: repo.url,
    namespace: repo.namespace,
    description: repo.description,
    defaultBranch: repo.defaultBranch,
    status: repo.status,
    language: repo.language,
    starCount: repo.starCount,
    forksCount: repo.forksCount,
    createdAt: repo.createdAt,
    updatedAt: repo.updatedAt,
  });

  // Background analysis
  (async () => {
    try {
      const [treeItems, languages] = await Promise.all([
        fetchRepositoryTree(urlInfo.projectPath, project.default_branch),
        fetchLanguages(urlInfo.projectPath),
      ]);

      const fileTree = buildFileTree(treeItems);
      const prompt = buildRepositoryAnalysisPrompt(project.name, fileTree, languages);

      const completion = await openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("Empty AI response");

      const analysis = JSON.parse(content);

      const primaryLang = Object.keys(languages).length > 0
        ? Object.entries(languages).sort((a, b) => b[1] - a[1])[0][0]
        : null;

      const langStats = Object.entries(languages).map(([language, percentage]) => ({
        language,
        percentage: parseFloat(percentage.toFixed(1)),
        fileCount: Math.round((treeItems.filter(i => i.type === "blob").length * percentage) / 100),
      }));

      await db.update(repositoriesTable).set({
        status: "ready",
        language: primaryLang,
        summary: analysis.overview || "",
        modules: (analysis.modules || analysis.mainModules?.map((m: { name: string }) => m.name) || []).slice(0, 15),
        keyServices: (analysis.services || analysis.keyServices?.map((s: { name: string }) => s.name) || []).slice(0, 15),
        techStack: (analysis.techStack || []).slice(0, 15),
        rawData: {
          overview: analysis.overview,
          purpose: analysis.purpose,
          mainModules: analysis.mainModules,
          keyServices: analysis.keyServices,
          entryPoints: analysis.entryPoints,
          techStack: analysis.techStack,
          fileTree: treeItems.slice(0, 300),
          languageStats: langStats,
          totalFiles: treeItems.filter(i => i.type === "blob").length,
        },
        updatedAt: new Date(),
      }).where(eq(repositoriesTable.id, repo.id));

      logger.info({ repoId: repo.id }, "Repository analysis complete");
    } catch (err) {
      logger.error({ err, repoId: repo.id }, "Repository analysis failed");
      const errMsg = err instanceof Error ? err.message : String(err);
      const friendlyError = errMsg.includes("insufficient_quota") || errMsg.includes("429")
        ? "OpenAI API quota exceeded — add credits at platform.openai.com/settings/billing, then retry."
        : errMsg.includes("401") || errMsg.includes("Unauthorized")
        ? "OpenAI API key is invalid or missing. Check your OPENAI_API_KEY secret."
        : errMsg.includes("GitLab") || errMsg.includes("403") || errMsg.includes("404")
        ? "Could not access GitLab repository. Check the URL and token permissions."
        : `Analysis failed: ${errMsg.slice(0, 120)}`;
      await db.update(repositoriesTable).set({
        status: "error",
        rawData: { errorMessage: friendlyError },
        updatedAt: new Date(),
      }).where(eq(repositoriesTable.id, repo.id));
    }
  })();
});

router.get("/repositories/:id", async (req, res): Promise<void> => {
  const params = GetRepositoryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [repo] = await db.select().from(repositoriesTable).where(eq(repositoriesTable.id, params.data.id));
  if (!repo) { res.status(404).json({ error: "Repository not found" }); return; }

  res.json({
    id: repo.id, name: repo.name, url: repo.url, namespace: repo.namespace,
    description: repo.description, defaultBranch: repo.defaultBranch,
    status: repo.status, language: repo.language, starCount: repo.starCount,
    forksCount: repo.forksCount, summary: repo.summary,
    modules: repo.modules || [], keyServices: repo.keyServices || [],
    techStack: repo.techStack || [],
    createdAt: repo.createdAt, updatedAt: repo.updatedAt,
  });
});

router.delete("/repositories/:id", async (req, res): Promise<void> => {
  const params = DeleteRepositoryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [repo] = await db.delete(repositoriesTable).where(eq(repositoriesTable.id, params.data.id)).returning();
  if (!repo) { res.status(404).json({ error: "Repository not found" }); return; }

  res.sendStatus(204);
});

router.post("/repositories/:id/reanalyze", async (req, res): Promise<void> => {
  const params = ReanalyzeRepositoryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [repo] = await db.select().from(repositoriesTable).where(eq(repositoriesTable.id, params.data.id));
  if (!repo) { res.status(404).json({ error: "Repository not found" }); return; }

  await db.update(repositoriesTable).set({
    status: "analyzing",
    rawData: null,
    updatedAt: new Date(),
  }).where(eq(repositoriesTable.id, params.data.id));

  const urlInfo = parseGitLabUrl(repo.url);
  if (!urlInfo) {
    await db.update(repositoriesTable).set({ status: "error", rawData: { errorMessage: "Invalid repository URL stored." }, updatedAt: new Date() }).where(eq(repositoriesTable.id, repo.id));
    res.status(400).json({ error: "Invalid repository URL" });
    return;
  }

  res.json({
    id: repo.id, name: repo.name, url: repo.url, namespace: repo.namespace,
    description: repo.description, defaultBranch: repo.defaultBranch,
    status: "analyzing", language: repo.language, starCount: repo.starCount,
    forksCount: repo.forksCount, errorMessage: null,
    createdAt: repo.createdAt, updatedAt: new Date(),
  });

  // Background re-analysis
  (async () => {
    try {
      const [treeItems, languages] = await Promise.all([
        fetchRepositoryTree(urlInfo.projectPath, repo.defaultBranch),
        fetchLanguages(urlInfo.projectPath),
      ]);

      const fileTree = buildFileTree(treeItems);
      const prompt = buildRepositoryAnalysisPrompt(repo.name, fileTree, languages);

      const completion = await openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("Empty AI response");

      const analysis = JSON.parse(content);
      const primaryLang = Object.keys(languages).length > 0
        ? Object.entries(languages).sort((a, b) => b[1] - a[1])[0][0] : null;
      const langStats = Object.entries(languages).map(([language, percentage]) => ({
        language, percentage: parseFloat(percentage.toFixed(1)),
        fileCount: Math.round((treeItems.filter(i => i.type === "blob").length * percentage) / 100),
      }));

      await db.update(repositoriesTable).set({
        status: "ready", language: primaryLang,
        summary: analysis.overview || "",
        modules: (analysis.modules || analysis.mainModules?.map((m: { name: string }) => m.name) || []).slice(0, 15),
        keyServices: (analysis.services || analysis.keyServices?.map((s: { name: string }) => s.name) || []).slice(0, 15),
        techStack: (analysis.techStack || []).slice(0, 15),
        rawData: {
          overview: analysis.overview, purpose: analysis.purpose,
          mainModules: analysis.mainModules, keyServices: analysis.keyServices,
          entryPoints: analysis.entryPoints, techStack: analysis.techStack,
          fileTree: treeItems.slice(0, 300), languageStats: langStats,
          totalFiles: treeItems.filter(i => i.type === "blob").length,
        },
        updatedAt: new Date(),
      }).where(eq(repositoriesTable.id, repo.id));

      logger.info({ repoId: repo.id }, "Re-analysis complete");
    } catch (err) {
      logger.error({ err, repoId: repo.id }, "Re-analysis failed");
      const errMsg = err instanceof Error ? err.message : String(err);
      const friendlyError = errMsg.includes("insufficient_quota") || errMsg.includes("429")
        ? "API quota exceeded — check your GROQ_API_KEY."
        : `Analysis failed: ${errMsg.slice(0, 120)}`;
      await db.update(repositoriesTable).set({
        status: "error", rawData: { errorMessage: friendlyError }, updatedAt: new Date(),
      }).where(eq(repositoriesTable.id, repo.id));
    }
  })();
});

router.get("/repositories/:id/summary", async (req, res): Promise<void> => {
  const params = GetRepositorySummaryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [repo] = await db.select().from(repositoriesTable).where(eq(repositoriesTable.id, params.data.id));
  if (!repo) { res.status(404).json({ error: "Repository not found" }); return; }

  const raw = repo.rawData as Record<string, unknown> | null;

  res.json({
    repositoryId: repo.id,
    overview: repo.summary || "Analysis pending...",
    purpose: (raw?.purpose as string) || "",
    mainModules: (raw?.mainModules as unknown[]) || (repo.modules || []).map((m) => ({ name: m, description: "", path: "", importance: "medium" })),
    keyServices: (raw?.keyServices as unknown[]) || (repo.keyServices || []).map((s) => ({ name: s, description: "", dependencies: [] })),
    entryPoints: (raw?.entryPoints as string[]) || [],
    techStack: repo.techStack || [],
  });
});

router.get("/repositories/:id/files", async (req, res): Promise<void> => {
  const params = GetRepositoryFilesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [repo] = await db.select().from(repositoriesTable).where(eq(repositoriesTable.id, params.data.id));
  if (!repo) { res.status(404).json({ error: "Repository not found" }); return; }

  const raw = repo.rawData as Record<string, unknown> | null;
  const treeItems = (raw?.fileTree as Array<{ name: string; path: string; type: string }>) || [];

  res.json(buildFileTreeNodes(treeItems));
});

router.get("/repositories/:id/stats", async (req, res): Promise<void> => {
  const params = GetRepositoryStatsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [repo] = await db.select().from(repositoriesTable).where(eq(repositoriesTable.id, params.data.id));
  if (!repo) { res.status(404).json({ error: "Repository not found" }); return; }

  const raw = repo.rawData as Record<string, unknown> | null;
  const languages = (raw?.languageStats as Array<{ language: string; percentage: number; fileCount: number }>) || [];
  const totalFiles = (raw?.totalFiles as number) || 0;

  res.json({
    repositoryId: repo.id,
    totalFiles,
    totalLines: Math.round(totalFiles * 45),
    languages,
    lastCommit: null,
    contributors: 0,
  });
});

router.get("/repositories/:id/chat", async (req, res): Promise<void> => {
  const params = ListChatMessagesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const messages = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.repositoryId, params.data.id))
    .orderBy(chatMessagesTable.createdAt);

  res.json(messages);
});

router.post("/repositories/:id/chat", async (req, res): Promise<void> => {
  const params = SendChatMessageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = SendChatMessageBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [repo] = await db.select().from(repositoriesTable).where(eq(repositoriesTable.id, params.data.id));
  if (!repo) { res.status(404).json({ error: "Repository not found" }); return; }

  await db.insert(chatMessagesTable).values({
    repositoryId: params.data.id,
    role: "user",
    content: body.data.content,
  });

  const history = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.repositoryId, params.data.id))
    .orderBy(chatMessagesTable.createdAt);

  const systemPrompt = buildChatSystemPrompt(
    repo.name,
    repo.summary || "Repository analysis pending.",
    repo.modules || [],
    repo.keyServices || [],
    repo.techStack || []
  );

  const chatMessages = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  const stream = await openai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 4096,
    messages: [{ role: "system", content: systemPrompt }, ...chatMessages],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullResponse += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  await db.insert(chatMessagesTable).values({
    repositoryId: params.data.id,
    role: "assistant",
    content: fullResponse,
  });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

router.delete("/repositories/:id/chat/clear", async (req, res): Promise<void> => {
  const params = ClearChatHistoryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  await db.delete(chatMessagesTable).where(eq(chatMessagesTable.repositoryId, params.data.id));
  res.sendStatus(204);
});

router.get("/repositories/:id/learning-path", async (req, res): Promise<void> => {
  const params = GetLearningPathParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [repo] = await db.select().from(repositoriesTable).where(eq(repositoriesTable.id, params.data.id));
  if (!repo) { res.status(404).json({ error: "Repository not found" }); return; }

  const [lp] = await db.select().from(learningPathsTable)
    .where(eq(learningPathsTable.repositoryId, params.data.id))
    .orderBy(desc(learningPathsTable.createdAt))
    .limit(1);

  if (!lp) { res.status(404).json({ error: "No learning path generated yet" }); return; }

  res.json({
    id: lp.id,
    repositoryId: lp.repositoryId,
    topic: lp.topic,
    steps: lp.steps,
    totalEstimatedMinutes: lp.totalEstimatedMinutes,
    difficulty: lp.difficulty,
    createdAt: lp.createdAt,
  });
});

router.post("/repositories/:id/learning-path", async (req, res): Promise<void> => {
  const params = GenerateLearningPathParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = GenerateLearningPathBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [repo] = await db.select().from(repositoriesTable).where(eq(repositoriesTable.id, params.data.id));
  if (!repo) { res.status(404).json({ error: "Repository not found" }); return; }

  const raw = repo.rawData as Record<string, unknown> | null;
  const treeItems = (raw?.fileTree as Array<{ name: string; path: string; type: string }>) || [];
  const fileTree = buildFileTree(treeItems);

  const prompt = buildLearningPathPrompt(
    repo.name,
    body.data.topic,
    repo.modules || [],
    repo.keyServices || [],
    fileTree
  );

  const completion = await openai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) { res.status(500).json({ error: "AI generation failed" }); return; }

  const result = JSON.parse(content);

  const [lp] = await db.insert(learningPathsTable).values({
    repositoryId: params.data.id,
    topic: body.data.topic,
    steps: result.steps || [],
    totalEstimatedMinutes: result.totalEstimatedMinutes || 0,
    difficulty: result.difficulty || "beginner",
  }).returning();

  res.json({
    id: lp.id,
    repositoryId: lp.repositoryId,
    topic: lp.topic,
    steps: lp.steps,
    totalEstimatedMinutes: lp.totalEstimatedMinutes,
    difficulty: lp.difficulty,
    createdAt: lp.createdAt,
  });
});

router.get("/repositories/:id/health", async (req, res): Promise<void> => {
  const params = GetHealthScoreParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const query = GetHealthScoreQueryParams.safeParse(req.query);
  const forceRefresh = query.success && query.data.refresh === true;

  const [repo] = await db.select().from(repositoriesTable).where(eq(repositoriesTable.id, params.data.id));
  if (!repo) { res.status(404).json({ error: "Repository not found" }); return; }

  const raw = repo.rawData as Record<string, unknown> | null;

  if (!forceRefresh && raw?.healthScore) {
    res.json(raw.healthScore);
    return;
  }

  const treeItems = (raw?.fileTree as Array<{ name: string; path: string; type: string }>) || [];
  const languageStats = (raw?.languageStats as Array<{ language: string; percentage: number }>) || [];
  const fileTree = buildFileTree(treeItems);
  const languages: Record<string, number> = Object.fromEntries(
    languageStats.map((l) => [l.language, l.percentage])
  );

  const prompt = buildHealthScorePrompt(
    repo.name,
    fileTree,
    languages,
    repo.modules || [],
    repo.techStack || [],
    repo.summary || ""
  );

  const completion = await openai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) { res.status(500).json({ error: "AI generation failed" }); return; }

  const result = JSON.parse(content);

  const healthScore = {
    repositoryId: repo.id,
    overallScore: result.overallScore ?? 50,
    riskLevel: result.riskLevel ?? "medium",
    categories: result.categories ?? [],
    insights: result.insights ?? [],
    recommendations: result.recommendations ?? [],
    generatedAt: new Date().toISOString(),
  };

  await db.update(repositoriesTable).set({
    rawData: { ...raw, healthScore },
    updatedAt: new Date(),
  }).where(eq(repositoriesTable.id, repo.id));

  res.json(healthScore);
});

router.get("/repositories/:id/architecture", async (req, res): Promise<void> => {
  const params = GetArchitectureParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [repo] = await db.select().from(repositoriesTable).where(eq(repositoriesTable.id, params.data.id));
  if (!repo) { res.status(404).json({ error: "Repository not found" }); return; }

  const [existing] = await db.select().from(architecturesTable)
    .where(eq(architecturesTable.repositoryId, params.data.id))
    .limit(1);

  if (existing) {
    res.json({
      repositoryId: existing.repositoryId,
      components: existing.components,
      dependencies: existing.dependencies,
      layers: existing.layers,
      diagramText: existing.diagramText,
    });
    return;
  }

  const raw = repo.rawData as Record<string, unknown> | null;
  const treeItems = (raw?.fileTree as Array<{ name: string; path: string; type: string }>) || [];
  const fileTree = buildFileTree(treeItems);

  const prompt = buildArchitecturePrompt(repo.name, fileTree, repo.modules || [], repo.keyServices || []);

  const completion = await openai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) { res.status(500).json({ error: "AI generation failed" }); return; }

  const result = JSON.parse(content);

  const [arch] = await db.insert(architecturesTable).values({
    repositoryId: params.data.id,
    components: result.components || [],
    dependencies: result.dependencies || [],
    layers: result.layers || [],
    diagramText: result.diagramText || "",
  }).returning();

  res.json({
    repositoryId: arch.repositoryId,
    components: arch.components,
    dependencies: arch.dependencies,
    layers: arch.layers,
    diagramText: arch.diagramText,
  });
});

export default router;
