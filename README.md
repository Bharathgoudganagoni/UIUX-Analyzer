# AI UI/UX Critic & Redesign Studio 🚀

A modern, production-ready full-stack AI-powered UI/UX analysis and redesign platform.

Upload any UI screenshot or analyze any live website to get:
- 🔍 **AI-Powered UI/UX Audit**: Structured breakdown of design issues across Layout, Typography, Color & Contrast, Spacing, Visual Hierarchy, Accessibility (WCAG), and Navigation.
- 💡 **Actionable Recommendations**: Specific advice explaining *why* each issue matters and *how* to fix it.
- 🎨 **Redesign Studio**: Interactive Before / After split-screen slider comparing the original design with the AI-improved version.
- ⚡ **React + CSS Code Generation**: Instant export of production-ready JSX and CSS code with live interactive preview, copy, and ZIP download.
- 🧪 **Instant Demo Mode**: Test and evaluate all features out-of-the-box without requiring external API keys.

---

## Architecture Overview

The system is built as a modular microservice architecture:

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (React 19 + Vite)                │
│    Dashboard, Analysis, Redesign Studio, Code Studio    │
└───────────────────────────┬─────────────────────────────┘
                            │ (REST API)
┌───────────────────────────▼─────────────────────────────┐
│             Backend (Node.js + Express)                 │
│  File Uploads, Orchestration, Prisma ORM, Sanitization │
└─────────────┬─────────────────────────────┬─────────────┘
              │                             │
┌─────────────▼─────────────┐ ┌─────────────▼─────────────┐
│  AI Service (Python/FastAPI)│ │  PostgreSQL Database     │
│  Vision AI, LLM, Ollama   │ │  Projects, History, Cache │
└───────────────────────────┘ └───────────────────────────┘
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Framer Motion, Lucide Icons, React Syntax Highlighter, React Dropzone.
- **Backend API**: Node.js, Express, Multer, Helmet, Sharp, Winston, Prisma ORM.
- **AI Microservice**: Python 3.11, FastAPI, Uvicorn, Pydantic, HTTPX, Ollama (LLaVA / LLaMA 3).
- **Database**: PostgreSQL with Prisma ORM (graceful in-memory fallback enabled if DB is offline).

---

## 🚀 Quick Start

### Option 1: Docker Compose (All-in-one)

```bash
docker-compose up --build
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:3001](http://localhost:3001)
- AI Service: [http://localhost:8000](http://localhost:8000)

---

### Option 2: Local Development

#### 1. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

#### 2. Start the Backend
```bash
cd backend
npm install
npm run dev
```

#### 3. Start the AI Microservice
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## 🤖 Ollama Vision Setup (Optional for Local AI Inference)

To run local vision models with 100% data privacy:
1. Install [Ollama](https://ollama.ai)
2. Pull the vision and text models:
   ```bash
   ollama pull llava
   ollama pull llama3
   ```
3. Start Ollama:
   ```bash
   ollama serve
   ```
The AI service connects automatically via `http://localhost:11434`.

---

## 🧪 Demo Mode
Click **"Try Demo Mode"** on the upload page to instantly analyze a sample dashboard with simulated high/medium/low severity UI/UX issues, visual hierarchy suggestions, and generated React code.
