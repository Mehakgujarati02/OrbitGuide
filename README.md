The Problem
Joining a large codebase is slow and frustrating. New engineers spend days — sometimes weeks — just figuring out what a repo does, where the important code lives, and how the pieces connect. There's no map. Documentation is usually stale. Senior devs get interrupted constantly answering the same questions.

The gap: there's no fast, interactive way for a developer to understand a codebase without reading every file themselves or pestering teammates.

How OrbitGuide Fixes It:-
OrbitGuide connects to any GitLab repository and runs an AI-powered analysis pipeline that produces an instant understanding layer on top of the codebase:

AI Overview — a plain-English summary of what the repo does, its purpose, main modules, key services, and entry points
Streaming AI Chat — ask any question about the codebase and get answers in real time (SSE streaming, full message history)
Learning Paths — generate step-by-step onboarding guides for any topic (e.g. "how does authentication work?")
Architecture Explorer — component dependency graph, layer breakdown, and ASCII flow diagram
Health Score — AI-evaluated codebase health across maintainability, documentation, test coverage, and complexity
No manual setup. No config files. Just paste a GitLab URL.

What Changes for the Developer
Before OrbitGuide	After OrbitGuide
Spend days reading files to understand the repo	Get an AI overview in under a minute
Ask senior devs the same onboarding questions	Ask the AI chat instead
No structured way to learn a new codebase	Generate a personalized learning path by topic
Architecture lives in someone's head	Visualize it instantly
No visibility into codebase quality	Health score with actionable insights
Tech Stack
Layer	Technology
Frontend	React 19, Vite, Tailwind CSS v4, shadcn/ui, wouter
Backend	Express 5, Node.js 24, TypeScript 5.9
Database	PostgreSQL + Drizzle ORM
AI	Groq — llama-3.3-70b-versatile (OpenAI-compatible SDK)
GitLab	GitLab REST API v4
API Contract	OpenAPI 3.1 → Orval codegen (React Query hooks + Zod schemas)
Validation	Zod v4, drizzle-zod
Monorepo	pnpm workspaces
Streaming	SSE (Server-Sent Events) for real-time chat
Architecture
┌─────────────────────────────────────────────────────────┐
│                     Browser (React)                      │
│  Landing → Dashboard → Repository Detail (5 tabs)        │
│  AI Chat uses raw fetch + ReadableStream (SSE)           │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTP / SSE  (path-based proxy)
┌───────────────────▼─────────────────────────────────────┐
│                  Express 5 API  /api/*                   │
│                                                          │
│  POST /repositories          → trigger analysis (async)  │
│  POST /repositories/:id/reanalyze → retry on error       │
│  GET  /repositories/:id/summary                          │
│  GET  /repositories/:id/files                            │
│  GET  /repositories/:id/stats                            │
│  POST /repositories/:id/chat  (SSE stream)               │
│  POST /repositories/:id/learning-path                    │
│  GET  /repositories/:id/learning-path                    │
│  GET  /repositories/:id/architecture                     │
│  GET  /repositories/:id/health                           │
└──────┬──────────────────────────────┬───────────────────┘
       │                              │
┌──────▼──────┐              ┌────────▼────────┐
│  PostgreSQL │              │   Groq API       │
│  (Drizzle)  │              │  llama-3.3-70b   │
│             │              │                  │
│ repositories│              │ analysis prompts │
│ chat_msgs   │              │ chat streaming   │
│ learning_   │              │ learning paths   │
│  paths      │              │ architecture     │
│ architectures│             │ health scoring   │
└─────────────┘              └──────────────────┘
                                      │
                             ┌────────▼────────┐
                             │   GitLab API v4  │
                             │                  │
                             │ project metadata │
                             │ file tree        │
                             │ language stats   │
                             └──────────────────┘

Key Design Decisions
Contract-first OpenAPI — lib/api-spec/openapi.yaml is the source of truth. Types and hooks are generated from it via Orval. Never written by hand.
Async analysis — repository analysis runs in the background after the POST returns. A status field (pending → analyzing → ready | error) tracks progress.
Architecture & health caching — expensive AI calls are cached in the DB after first generation.
SSE streaming — chat uses raw fetch + ReadableStream on the client (not generated hooks) for real-time token streaming.
Graceful degradation — GitLab token is optional; the app surfaces friendly errors if not set.
Project Structure
artifacts-monorepo/
├── artifacts/
│   ├── api-server/          # Express 5 backend
│   │   └── src/
│   │       ├── routes/repositories/   # All route handlers
│   │       └── lib/
│   │           ├── gitlab.ts          # GitLab API client
│   │           ├── openai.ts          # Groq client (OpenAI-compatible)
│   │           └── ai-prompts.ts      # All AI prompt templates
│   └── orbitguide/          # React + Vite frontend
│       └── src/
│           ├── pages/        # dashboard.tsx, repository.tsx, landing.tsx
│           └── components/tabs/  # overview, chat, learning-path, architecture, health
├── lib/
│   ├── api-spec/            # openapi.yaml (source of truth)
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod schemas
│   └── db/                  # Drizzle ORM schema + migrations
└── pnpm-workspace.yaml

Getting Started
Prerequisites
Node.js 24+
pnpm 9+
PostgreSQL database
Groq API key (free)
GitLab Personal Access Token (scopes: read_api, read_repository)
Setup
# Install dependencies
pnpm install

# Set environment variables
DATABASE_URL=postgresql://...
GROQ_API_KEY=gsk_...
GITLAB_TOKEN=glpat-...
SESSION_SECRET=your-secret

# Push database schema
pnpm --filter @workspace/db run push

# Run API server (port 5000)
pnpm --filter @workspace/api-server run dev

# Run frontend
pnpm --filter @workspace/orbitguide run dev

Codegen (after changing openapi.yaml)
pnpm --filter @workspace/api-spec run codegen

Features at a Glance
Add any GitLab repo by URL — public or private (with token)
Background analysis with status tracking and retry on failure
Real-time streaming AI chat with full message history and markdown rendering
Per-topic learning path generation
Architecture visualization with dependency graph and layer breakdown
Codebase health scoring with actionable insights
Dark mode, dense IDE-like aesthetic
