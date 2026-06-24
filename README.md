OrbitGuide 🚀
AI-Powered GitLab Repository Intelligence & Developer Onboarding

OrbitGuide helps developers understand unfamiliar GitLab repositories in minutes instead of days using AI-powered repository analysis, architecture exploration, interactive chat, and personalized learning paths.

🎯 The Problem

Joining a new codebase is slow and frustrating.

Developers often spend hours or days:
Reading documentation
Exploring folder structures
Understanding dependencies
Identifying important modules
Asking senior engineers repetitive questions

Knowledge becomes concentrated among a few experienced developers, making onboarding inefficient and costly.

💡 The Solution

OrbitGuide transforms any GitLab repository into an AI-navigable knowledge base.

Simply paste a GitLab repository URL and OrbitGuide automatically:

Analyzes the repository structure
Generates an AI-powered summary
Explains architecture and dependencies
Creates personalized learning paths
Provides an AI chat assistant for repository-specific questions
Evaluates repository health and maintainability
✨ Features
🤖 AI Repository Chat

Ask repository-specific questions such as:

How does authentication work?
Which files handle API requests?
What is the data flow in this application?
Which modules are most important for onboarding?

Supports real-time streaming responses using Server-Sent Events (SSE).

📖 Personalized Learning Paths

Generate structured learning plans for any repository topic.

Examples:

Authentication
Database Architecture
API Layer
Frontend Components
State Management
🏗 Architecture Explorer

Visualize repository structure through:

Component dependency graphs
Layer breakdowns
Service relationships
Architecture flow diagrams
📊 Repository Intelligence Dashboard

Automatically extracts:

Repository summary
Core modules
Tech stack
Language statistics
File structure insights
Key services
❤️ Repository Health Analysis

Analyze codebase quality across:

Maintainability
Documentation quality
Complexity
Test coverage readiness
Developer onboarding experience
🔄 How It Works
GitLab Repository URL
           │
           ▼
 Repository Analysis
           │
           ▼
 GitLab API Extraction
           │
           ▼
 AI Understanding Layer
           │
   ┌───────┼────────┐
   ▼       ▼        ▼
Summary  Chat   Learning Path
           │
           ▼
 Architecture Explorer
🛠 Tech Stack
Frontend
React
Vite
TypeScript
Tailwind CSS v4
shadcn/ui
Wouter
Backend
Node.js
Express 5
TypeScript
Database
PostgreSQL
Drizzle ORM
drizzle-zod
AI
Groq API
Llama 3.3 70B Versatile
OpenAI-Compatible SDK
GitLab Integration
GitLab REST API v4
GitLab Personal Access Token Authentication
API Development
OpenAPI 3.1
Orval Code Generation
Zod Validation
📁 Project Structure
OrbitGuide
│
├── Frontend (React)
│   └── Dashboard
│   └── AI Chat
│   └── Learning Paths
│   └── Architecture Explorer
│
├── API Server (Express)
│   └── Repository Analysis
│   └── Chat Streaming
│   └── Learning Path Generation
│   └── Architecture Generation
│
├── PostgreSQL Database
│   └── Repositories
│   └── Chat Messages
│   └── Learning Paths
│   └── Architectures
│
└── GitLab + AI Layer
    └── GitLab API
    └── Groq LLM
🚀 Getting Started
Clone Repository
git clone https://github.com/Mehakgujarati02/OrbitGuide.git
cd OrbitGuide
Install Dependencies
pnpm install
Environment Variables

Create a .env file:

DATABASE_URL=your_postgresql_connection_string

GROQ_API_KEY=your_groq_api_key

GITLAB_TOKEN=your_gitlab_personal_access_token
Run Backend
pnpm --filter @workspace/api-server run dev
Run Frontend
pnpm --filter @workspace/orbitguide run dev
📸 Screenshots

Add screenshots here:

Landing Page

(Insert screenshot)

Repository Dashboard

(Insert screenshot)

AI Chat

(Insert screenshot)

Learning Path Generator

(Insert screenshot)

Architecture Explorer

(Insert screenshot)

🎖 Use Cases
New Developer Onboarding

Reduce onboarding time from days to minutes.

Repository Exploration

Quickly understand large and unfamiliar projects.

Team Knowledge Sharing

Make architectural knowledge accessible to everyone.

Technical Documentation

Generate contextual explanations directly from source code.

🔮 Future Enhancements
Multi-repository analysis
Pull request intelligence
Code smell detection
Security analysis
Architecture evolution tracking
Team onboarding analytics
