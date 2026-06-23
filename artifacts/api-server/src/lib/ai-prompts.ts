export function buildRepositoryAnalysisPrompt(
  repoName: string,
  fileTree: string,
  languages: Record<string, number>
): string {
  const langList = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, pct]) => `${lang} (${pct.toFixed(1)}%)`)
    .join(", ");

  return `You are an expert software architect analyzing the codebase "${repoName}" to help new developers onboard quickly.

Repository file structure:
${fileTree}

Primary languages: ${langList || "Unknown"}

Please analyze this codebase and provide a structured response in JSON format with these exact fields:
{
  "overview": "2-3 sentence summary of what this project does",
  "purpose": "The core business/technical purpose of this codebase",
  "mainModules": [
    {
      "name": "Module name",
      "description": "What this module does",
      "path": "relative/path/to/module",
      "importance": "high|medium|low"
    }
  ],
  "keyServices": [
    {
      "name": "ServiceName",
      "description": "What this service does",
      "dependencies": ["OtherService", "Repository"]
    }
  ],
  "entryPoints": ["path/to/main.ts", "path/to/app.ts"],
  "techStack": ["React", "TypeScript", "PostgreSQL"],
  "modules": ["ModuleA", "ModuleB"],
  "services": ["ServiceA", "ServiceB"]
}

Focus on helping a junior developer understand:
1. What the codebase does at a high level
2. Which parts are most important to understand first
3. How the main components interact
4. What technologies are used

Be accurate and specific. Identify real patterns in the file structure. Maximum 10 modules and 10 services.`;
}

export function buildChatSystemPrompt(
  repoName: string,
  summary: string,
  modules: string[],
  keyServices: string[],
  techStack: string[]
): string {
  return `You are OrbitGuide AI, an expert developer onboarding assistant for the "${repoName}" codebase.

Repository Overview:
${summary}

Main Modules: ${modules.join(", ") || "Not analyzed yet"}
Key Services: ${keyServices.join(", ") || "Not analyzed yet"}
Tech Stack: ${techStack.join(", ") || "Not analyzed yet"}

Your role is to help developers understand this codebase. When answering questions:

1. **Be beginner-friendly** — explain concepts clearly without assuming deep knowledge
2. **Be technically accurate** — give real file paths, class names, and method names when known
3. **Use structured formatting** — use markdown with headers, bullet points, and code blocks
4. **Show relationships** — explain how components connect to each other
5. **Recommend learning order** — when relevant, suggest what to read first

When showing dependency flows, use this text diagram format:
\`\`\`
Component A
  ↓ calls
Component B
  ↓ uses
Component C
\`\`\`

Always include:
- What the thing does
- Why it exists
- How it connects to other parts
- What a new developer should look at first

Keep responses focused and actionable. If asked about something outside this codebase, redirect politely.`;
}

export function buildLearningPathPrompt(
  repoName: string,
  topic: string,
  modules: string[],
  keyServices: string[],
  fileTree: string
): string {
  return `You are an expert software architect creating a structured learning path for a new developer joining the "${repoName}" codebase.

The developer wants to learn: "${topic}"

Available modules: ${modules.join(", ") || "Various modules"}
Key services: ${keyServices.join(", ") || "Various services"}

File structure (sample):
${fileTree.substring(0, 3000)}

Create a step-by-step learning path in JSON format:
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Start with the entry point",
      "description": "Detailed explanation of what to read and why, written for a junior developer",
      "files": ["src/main.ts", "src/app.ts"],
      "estimatedMinutes": 30,
      "concepts": ["Dependency Injection", "Application Bootstrap"]
    }
  ],
  "totalEstimatedMinutes": 180,
  "difficulty": "beginner|intermediate|advanced"
}

Requirements:
- 4-8 steps maximum
- Each step should build on the previous one
- Files should be real paths likely in this codebase
- Descriptions should be clear and motivating for a junior developer
- Concepts should be specific technical concepts learned in that step
- Estimate time honestly (reading + understanding, not just scanning)
- Focus specifically on "${topic}" — don't make it generic
- difficulty: beginner if the topic is introductory, intermediate for core systems, advanced for complex internals`;
}

export function buildArchitecturePrompt(
  repoName: string,
  fileTree: string,
  modules: string[],
  keyServices: string[]
): string {
  return `You are an expert software architect mapping the architecture of "${repoName}" for developer onboarding.

File structure:
${fileTree.substring(0, 4000)}

Known modules: ${modules.join(", ")}
Known services: ${keyServices.join(", ")}

Analyze and return a complete architecture map in JSON format:
{
  "components": [
    {
      "id": "auth-controller",
      "name": "AuthController",
      "type": "controller|service|repository|model|config|utility|middleware|other",
      "description": "Handles authentication HTTP endpoints",
      "filePath": "src/controllers/auth.controller.ts",
      "layer": "API"
    }
  ],
  "dependencies": [
    {
      "from": "auth-controller",
      "to": "auth-service",
      "type": "calls|imports|extends|implements"
    }
  ],
  "layers": [
    {
      "name": "API Layer",
      "description": "HTTP controllers and request handling",
      "components": ["auth-controller", "user-controller"]
    }
  ],
  "diagramText": "User Request\\n  ↓\\nAPI Layer (Controllers)\\n  ↓\\nService Layer (Business Logic)\\n  ↓\\nRepository Layer (Data Access)\\n  ↓\\nDatabase"
}

Requirements:
- Identify 8-20 real components based on the file structure
- Group them into 3-5 architectural layers (API, Service, Repository, Domain, Infrastructure, etc.)
- Map real dependencies between components
- The diagramText should be a clear ASCII text diagram showing the main flow
- Use actual file names and class names from the file tree when possible
- Focus on the most important components, not every single file`;
}
