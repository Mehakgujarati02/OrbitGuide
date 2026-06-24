#OrbitGuide 
AI-Powered GitLab Repository Intelligence & Developer Onboarding

OrbitGuide helps developers understand unfamiliar GitLab repositories in minutes instead of days using AI-powered repository analysis, architecture exploration, interactive chat, and personalized learning paths.

#🎯 The Problem

Joining a new codebase is slow and frustrating.

Developers often spend hours or days:
Reading documentation
Exploring folder structures
Understanding dependencies
Identifying important modules
Asking senior engineers repetitive questions

Knowledge becomes concentrated among a few experienced developers, making onboarding inefficient and costly.

#💡 The Solution

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
## 🔄 How It Works

```text
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
```


## 🛠 Tech Stack

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Wouter

### Backend
- Node.js
- Express 5
- TypeScript

### Database
- PostgreSQL
- Drizzle ORM

### AI
- Groq API
- Llama 3.3 70B

### GitLab Integration
- GitLab REST API v4
- Personal Access Tokens

## 📁 Project Structure

```text
OrbitGuide
│
├── Frontend (React)
│   ├── Dashboard
│   ├── AI Chat
│   ├── Learning Paths
│   └── Architecture Explorer
│
├── API Server (Express)
│   ├── Repository Analysis
│   ├── Chat Streaming
│   ├── Learning Path Generation
│   └── Architecture Generation
│
├── PostgreSQL Database
│   ├── Repositories
│   ├── Chat Messages
│   ├── Learning Paths
│   └── Architectures
│
└── GitLab + AI Layer
    ├── GitLab API
    └── Groq LLM
```

## 🚀 Getting Started

### Clone Repository

```bash
git clone https://github.com/Mehakgujarati02/OrbitGuide.git
cd OrbitGuide
```

### Install Dependencies

```bash
pnpm install
```
Environment Variables

Create a .env file:

DATABASE_URL=your_postgresql_connection_string

GROQ_API_KEY=your_groq_api_key

GITLAB_TOKEN=your_gitlab_personal_access_token
Run Backend
pnpm --filter @workspace/api-server run dev
Run Frontend
pnpm --filter @workspace/orbitguide run dev

#📸 Screenshots

1)Landing Page
<img width="1887" height="835" alt="Screenshot 2026-06-24 222131" src="https://github.com/user-attachments/assets/bc679730-6d49-4eda-b292-efe0250af3f1" />


Repository Dashboard

<img width="1906" height="851" alt="Screenshot 2026-06-24 222207" src="https://github.com/user-attachments/assets/a679935a-5b82-4d6c-b99f-398cd9bce459" />

<img width="1872" height="882" alt="Screenshot 2026-06-24 222227" src="https://github.com/user-attachments/assets/cff3a748-79a7-4f22-bb91-9f54136dbc80" />

<img width="1856" height="803" alt="Screenshot 2026-06-24 222244" src="https://github.com/user-attachments/assets/c4930970-bbb4-4202-957f-6623bbe8e1ac" />


AI Chat
<img width="1871" height="833" alt="Screenshot 2026-06-24 222320" src="https://github.com/user-attachments/assets/498c924a-fdeb-4ede-9bb0-f4e880532f38" />


Learning Path Generator
<img width="1821" height="851" alt="Screenshot 2026-06-24 222500" src="https://github.com/user-attachments/assets/9f44d47b-0762-415d-9cca-c043373bf20b" />


Architecture Explorer
<img width="1811" height="847" alt="Screenshot 2026-06-24 222533" src="https://github.com/user-attachments/assets/c170bd13-3171-4ccc-8571-15430575fd0c" />

<img width="1862" height="856" alt="Screenshot 2026-06-24 222559" src="https://github.com/user-attachments/assets/1f6230f8-fb87-42f0-8697-727fc8a6e386" />

Health Analysis
<img width="1898" height="872" alt="Screenshot 2026-06-24 222622" src="https://github.com/user-attachments/assets/22589760-a056-4866-9ca3-d9643df4de3e" />

<img width="1847" height="672" alt="Screenshot 2026-06-24 222650" src="https://github.com/user-attachments/assets/6ba880ff-2a5e-45f3-8f94-c02db775ad79" />


#🎖 Use Cases
New Developer Onboarding
Reduce onboarding time from days to minutes.
Repository Exploration
Quickly understand large and unfamiliar projects.
Team Knowledge Sharing
Make architectural knowledge accessible to everyone.
Technical Documentation
Generate contextual explanations directly from source code.

#🔮 Future Enhancements
Multi-repository analysis
Pull request intelligence
Code smell detection
Security analysis
Architecture evolution tracking
Team onboarding analytics
