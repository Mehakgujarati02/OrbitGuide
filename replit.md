# OrbitGuide

AI-powered developer onboarding platform that helps new engineers understand large GitLab codebases through AI chat, learning paths, and architecture exploration.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/orbitguide run dev` — run the frontend (uses PORT env)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `GROQ_API_KEY` — Groq API key for AI features (free at console.groq.com)
- Required env: `GITLAB_TOKEN` — GitLab Personal Access Token (read_api, read_repository scopes)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4 + shadcn/ui + wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: Groq llama-3.3-70b-versatile (chat completions, streaming SSE) via OpenAI-compatible SDK
- GitLab: GitLab REST API v4 (project fetch, file tree, languages)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — Drizzle ORM schemas (repositories, chat_messages, learning_paths, architectures)
- `artifacts/api-server/src/routes/repositories/` — all repository, chat, learning path, and architecture routes
- `artifacts/api-server/src/lib/gitlab.ts` — GitLab API client
- `artifacts/api-server/src/lib/openai.ts` — OpenAI client
- `artifacts/api-server/src/lib/ai-prompts.ts` — all AI prompt templates
- `artifacts/orbitguide/src/` — React frontend

## Architecture decisions

- Contract-first OpenAPI: all types generated from `lib/api-spec/openapi.yaml` via Orval
- Repository analysis runs async in the background after creation — status field tracks progress (pending → analyzing → ready | error)
- Chat uses SSE streaming (raw fetch on the client, not generated hook) for real-time AI responses
- Architecture data is cached in the DB after first generation (expensive AI call)
- GitLab token is optional — app degrades gracefully if not set
- Dark mode applied by adding `dark` class to `document.documentElement` in `main.tsx` (Tailwind v4 variant system)

## Product

- **Landing page**: Marketing page with hero, feature highlights, CTA
- **Dashboard**: List all analyzed repos, add new repo by GitLab URL
- **Repository Detail** (4 tabs):
  - **Overview**: AI summary, modules, key services, tech stack, file/language stats
  - **AI Chat**: Streaming chat with GPT-4o-mini, full message history, markdown rendering
  - **Learning Path**: Generate step-by-step learning guides by topic (e.g. "authentication")
  - **Architecture**: Component dependency graph, layer breakdown, ASCII flow diagram

## User preferences

- Dark mode by default, dense IDE-like aesthetic
- No emojis in the UI

## Gotchas

- `@apply dark` is invalid in Tailwind v4 — use `document.documentElement.classList.add("dark")` in `main.tsx`
- Tailwind v4 uses `@custom-variant dark (&:is(.dark *))` pattern — dark variants work via `.dark` class on `<html>`
- SSE endpoints (chat) cannot use generated Orval hooks — use raw fetch + ReadableStream
- `node-fetch` is installed but native `fetch` is used in `gitlab.ts` (Node 24 has it built-in)
- Always run codegen after changing `openapi.yaml` before touching route handlers

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
