# Agentic Research Assistant

Agentic Research Assistant is a local-first PDF analysis workspace. The FastAPI backend ingests PDFs, slices them into semantic sections, embeds each chunk with sentence-transformers, and stores them in FAISS for rapid similarity search. The React frontend lets analysts upload documents, pick the relevant files, ask grounded questions, generate summaries, and read source excerpts without leaving the browser.

## Key Features
- **One-click ingestion** - upload PDFs, auto-extract text with `pdfplumber`, detect headings, merge tiny sections, and build FAISS indexes.
- **Targeted QA** - choose specific documents, embed the user question, retrieve the most relevant sections, and answer via OpenRouter (GPT-4o mini by default).
- **Document summaries** - generate section-level summaries tailored to detected document types (research paper, legal, etc.) with reusable prompt templates.
- **Source transparency** - answers return the originating section titles plus similarity scores so reviewers can open the exact PDF passages served at `/files/<name>`.
- **Modern UI** - Vite + React + Tailwind interface with a document library sidebar, contextual chat, and Markdown summaries.

## Repository Layout
```
agent/
|-- backend/
|   |-- main.py              # FastAPI entry point, mounts routers and static files
|   |-- api/                 # Upload, list, summarize, and QA routes
|   |-- agents/              # Sectioning, metadata, indexing, QA/summarization helpers
|   |-- core/                # Embeddings, FAISS vector store, PDF parser, LLM client
|   |-- requirements.txt     # Base FastAPI stack (install extras noted below)
|   `-- storage/             # Uploaded PDFs served via /files (git-ignored recommended)
|-- frontend/
|   |-- src/                 # React app (Sidebar, Chat, SummaryModal components)
|   |-- package.json         # React/Tailwind/Vite toolchain
|   `-- dist/                # Production builds (generated)
`-- activate.txt             # Developer note / optional helper script
```

## Tech Stack
- **Backend:** Python 3.11+, FastAPI, Uvicorn, `pdfplumber`, `sentence-transformers` (`all-MiniLM-L6-v2`), `faiss-cpu`, `numpy`, OpenAI SDK (pointed at OpenRouter).
- **Frontend:** React 19, Vite 7, Tailwind CSS 4, Axios, Lucide React icons, clsx, React Markdown.
- **Runtime services:** Local filesystem storage for PDFs, OpenRouter API key for LLM calls.

> **Note:** `backend/requirements.txt` lists only the minimal FastAPI dependencies. Install the additional libraries shown above for embeddings, FAISS, and PDF parsing.

## Getting Started

### Prerequisites
- Python 3.11 or newer
- Node.js 18+ and npm
- An [OpenRouter](https://openrouter.ai/) API key with access to `openai/gpt-4o-mini` (or any supported chat model)

### Backend setup
```bash
cd backend
python -m venv .venv
# Activate the environment (PowerShell)
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install sentence-transformers faiss-cpu pdfplumber openai numpy
setx OPENROUTER_API_KEY "sk-..."  # or export in your shell profile
uvicorn main:app --reload --port 8000
```
The app pre-creates `storage/` and exposes it under `http://localhost:8000/files`. Keep this directory on a persistent volume if you want uploads to survive restarts.

### Frontend setup
```bash
cd frontend
npm install
npm run dev -- --port 3000
```
The default CORS configuration allows `http://localhost:3000`. If you serve the UI from a different origin or port, update `allow_origins` in `backend/main.py` accordingly.

### Running everything
1. Start the backend server (port 8000).
2. Start the Vite dev server (port 3000) in a second terminal.
3. Visit `http://localhost:3000` in your browser.

## Usage Workflow
1. **Upload PDFs** via the sidebar button. The backend extracts text, sections, embeddings, and detects document type.
2. **Select documents** to establish the retrieval scope; questions without a selection are rejected to avoid hallucinated context.
3. **Ask questions** inside the chat panel. Responses include cited sections, and you can open the raw PDF via the eye icon.
4. **Generate summaries** with the sparkle button; summaries show document type, number of sections processed, and Markdown-formatted notes.
5. **Manage documents** - delete stale files (removing their embeddings) or redetect metadata via the list endpoint.

## Configuration & Environment
| Setting | Location | Description |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | env var | Required for QA and summarization; set before launching FastAPI |
| `STORAGE_DIR` | `backend/api/upload.py` | Change if you want to store PDFs elsewhere |
| `MAX_SECTIONS` | `backend/api/summarize.py` | Limits sections summarized per request |
| CORS origins | `backend/main.py` | Add frontend origins or switch to `[*]` in trusted deployments |

## Development Tips
- Avoid committing generated folders such as `backend/venv`, `frontend/node_modules`, and `frontend/dist`. Add a root `.gitignore` if you plan to share the repo.
- The API currently holds embeddings in memory only (`core/document_memory.py`). Restarting the server clears indexes; re-opening a document triggers lazy re-indexing when you ask a question.
- `/documents/ask_all` is experimental and expects FAISS search results; prefer `/documents/ask-selected` in production.
- Update `agents/summarization_prompts.py` or swap models in `core/openrouter_llm.py` to customize behavior.

## Roadmap Ideas
- Persist embeddings/metadata to a real database or vector store.
- Stream answers to the UI, including token-level progress indicators.
- Enforce auth, rate limiting, and secure filename handling for multi-user deployments.
- Expand document-type detection beyond keyword heuristics (e.g., lightweight classifiers).
