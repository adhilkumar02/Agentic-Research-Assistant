# Agentic Research Assistant

A local-first, AI-powered tool for exploring and chatting with your PDF documents. It ingests PDFs, chunks and embeds the text, and lets you ask questions grounded strictly in the documents you select.

---

## 🚀 Quick Start

### 1. Start the Backend
Runs the FastAPI server, FAISS vector store, and LLM orchestration.

```bash
cd backend
python -m venv .venv
# Activate: `.\.venv\Scripts\Activate.ps1` (Windows) or `source .venv/bin/activate` (Mac/Linux)
pip install -r requirements.txt

# Set your API key
# Windows (Command Prompt):
set OPENROUTER_API_KEY=sk-your-key
# Mac/Linux/PowerShell:
export OPENROUTER_API_KEY="sk-your-key"

uvicorn main:app --reload --port 8000
```
*The backend runs at `http://127.0.0.1:8000`.*

### 2. Start the Frontend
Runs the Vite + React web interface.

```bash
cd frontend
npm install
npm run dev
```
*The frontend typically runs at `http://localhost:3000` or `http://localhost:3001`.*

---

## ✨ Features

- **Grounded Q&A**: Ask questions and get answers based *only* on the documents you select.
- **Section Summaries**: Generate instant, cached summaries of document sections.
- **Smart Ingestion**: Automatically detects document types (e.g., Legal, Research) and extracts text using `pdfplumber`.
- **Local Embeddings**: Uses `all-MiniLM-L6-v2` to create embeddings stored in a local FAISS vector index.
- **Premium UI**: Dark mode glassmorphism design with markdown rendering, upload progress, and document type badges.

---

## ⚙️ Configuration

Set these environment variables in your backend terminal before starting:

| Variable | Description | Default |
|---|---|---|
| `OPENROUTER_API_KEY` | **Required.** Your OpenRouter API key. | - |
| `OPENROUTER_MODEL` | The LLM model to use for chat and summaries. | `openai/gpt-4o-mini` |
| `ALLOWED_ORIGINS` | CORS origins for the frontend. | `http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001` |

*To change the frontend's API target, set `VITE_API_BASE_URL` in `frontend/.env`.*

---

## 🛠️ Tech Stack

- **Backend:** Python, FastAPI, FAISS, Sentence Transformers, pdfplumber.
- **Frontend:** React, Vite, Tailwind CSS (v4), Lucide Icons, Axios.
