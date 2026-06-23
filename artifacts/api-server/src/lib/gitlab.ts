import { logger } from "./logger";

const GITLAB_TOKEN = process.env.GITLAB_TOKEN;
const GITLAB_BASE_URL = "https://gitlab.com/api/v4";

interface GitLabProject {
  id: number;
  name: string;
  name_with_namespace: string;
  path: string;
  path_with_namespace: string;
  description: string | null;
  default_branch: string;
  http_url_to_repo: string;
  web_url: string;
  star_count: number;
  forks_count: number;
  last_activity_at: string;
  language?: string;
}

interface GitLabTreeItem {
  id: string;
  name: string;
  type: "blob" | "tree";
  path: string;
  mode: string;
}

interface GitLabLanguages {
  [language: string]: number;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (GITLAB_TOKEN) {
    headers["PRIVATE-TOKEN"] = GITLAB_TOKEN;
  }
  return headers;
}

export function parseGitLabUrl(url: string): { namespace: string; projectPath: string } | null {
  try {
    const cleanUrl = url.trim().replace(/\.git$/, "");
    const parsed = new URL(cleanUrl);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const projectPath = parts.join("/");
    const namespace = parts.slice(0, -1).join("/");
    return { namespace, projectPath };
  } catch {
    return null;
  }
}

export async function fetchProject(projectPath: string): Promise<GitLabProject | null> {
  try {
    const encodedPath = encodeURIComponent(projectPath);
    const response = await fetch(`${GITLAB_BASE_URL}/projects/${encodedPath}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      logger.warn({ status: response.status, projectPath }, "GitLab project fetch failed");
      return null;
    }
    return response.json() as Promise<GitLabProject>;
  } catch (err) {
    logger.error({ err }, "Error fetching GitLab project");
    return null;
  }
}

export async function fetchRepositoryTree(projectPath: string, branch = "main"): Promise<GitLabTreeItem[]> {
  try {
    const encodedPath = encodeURIComponent(projectPath);
    const items: GitLabTreeItem[] = [];
    let page = 1;
    const perPage = 100;

    while (page <= 5) {
      const response = await fetch(
        `${GITLAB_BASE_URL}/projects/${encodedPath}/repository/tree?recursive=true&ref=${branch}&per_page=${perPage}&page=${page}`,
        { headers: getHeaders() }
      );
      if (!response.ok) break;
      const batch = (await response.json()) as GitLabTreeItem[];
      if (!batch.length) break;
      items.push(...batch);
      if (batch.length < perPage) break;
      page++;
    }
    return items;
  } catch (err) {
    logger.error({ err }, "Error fetching repository tree");
    return [];
  }
}

export async function fetchLanguages(projectPath: string): Promise<GitLabLanguages> {
  try {
    const encodedPath = encodeURIComponent(projectPath);
    const response = await fetch(`${GITLAB_BASE_URL}/projects/${encodedPath}/languages`, {
      headers: getHeaders(),
    });
    if (!response.ok) return {};
    return response.json() as Promise<GitLabLanguages>;
  } catch {
    return {};
  }
}

export async function fetchFileContent(projectPath: string, filePath: string, branch = "main"): Promise<string | null> {
  try {
    const encodedPath = encodeURIComponent(projectPath);
    const encodedFile = encodeURIComponent(filePath);
    const response = await fetch(
      `${GITLAB_BASE_URL}/projects/${encodedPath}/repository/files/${encodedFile}/raw?ref=${branch}`,
      { headers: getHeaders() }
    );
    if (!response.ok) return null;
    return response.text();
  } catch {
    return null;
  }
}

export type { GitLabProject, GitLabTreeItem, GitLabLanguages };
