# Agentic Research Assistant

## Project Overview
Agentic Research Assistant is a local-first workflow for exploring lengthy PDF corpora. The FastAPI backend ingests uploaded PDFs, segments them into semantic sections, embeds each section with sentence-transformers, and stores vectors in FAISS to support grounded retrieval. The Vite + React frontend exposes uploads, document management, contextual chat, and section summaries so analysts can inspect sources without leaving the browser.

## Key Features
- PDF upload pipeline with pdfplumber-based text extraction and heading-aware sectioning.
- Document-type detection using keyword heuristics that tailor downstream prompt templates.
- SentenceTransformer (all-MiniLM-L6-v2) embeddings persisted per document inside FAISS indexes.
- Question answering restricted to explicitly selected documents, returning cited section metadata.
- Section-level summarization with document-type-specific prompts and Markdown rendering.
- React interface featuring document library search, upload/delete controls, contextual chat, and summary modal.
- Static hosting of the raw PDFs under `/files/<filename>` for direct inspection.

## High-Level Architecture
```
+---------------------------+          +--------------------------------------+
|        Frontend           | <------> |              FastAPI API             |
| (Vite, React, Tailwind)   |  HTTP    | (Routers orchestrate agents + cores) |
+-------------^-------------+          +--------------------^-----------------+
              |                                      |
              |                                      |
              |                       +--------------+--------------+
              |                       |        Agents Layer         |
              |                       | sectioning / typing / QA /  |
              |                       | summarization / indexing    |
              |                       +--------------^--------------+
              |                                      |
              |                                      |
              |                   +------------------+------------------+
              |                   |    Core Services & Memory          |
              |                   | embeddings, FAISS, pdf parser, LLM |
              |                   +------------------------------------+
```

## Agent Breakdown
| Module | Responsibility |
| --- | --- |
| `sectioning_agent.py` | Detects headings (keyword, numbering, uppercase, title case) and partitions text into sections with positional metadata. |
| `section_postprocessor.py` | Merges sections shorter than a configurable threshold (default 300 chars) into their predecessor. |
| `document_type_agent.py` | Scores keyword hits across predefined document classes (research, legal, T&C, etc.) and outputs type plus confidence. |
| `indexing_agent.py` | Embeds each section, instantiates a FAISS `IndexFlatL2`, and stores (embedding, text, metadata) entries for later search. |
| `summarization_prompts.py` | Houses reusable prompt templates keyed by document type for consistent summaries. |
| `summarization_agent.py` | Assembles prompts and calls the configured LLM to summarize a single section. |
| `qa_agent.py` | Builds retrieval-augmented prompts from scored sections and enforces context-only answers. |

## Backend Folder Structure
```
backend/
|-- main.py                # FastAPI app, CORS, router wiring, static storage mount
|-- requirements.txt       # Backend dependencies (FastAPI, FAISS, embeddings, OpenRouter client)
|-- api/
|   |-- upload.py          # Upload/delete documents, trigger ingestion
|   |-- list_documents.py  # Enumerate stored PDFs, repair missing metadata
|   |-- sections.py        # Return section list for a document
|   |-- summarize.py       # Summaries per section (max 10)
|   |-- ask.py             # Question answering over selected documents (lazy indexes)
|   `-- ask_all.py         # Experimental cross-document QA using existing indexes
|-- agents/                # Sectioning, typing, indexing, QA, summarization helpers
|-- core/
|   |-- document_memory.py # In-memory registries for indexes + metadata
|   |-- embeddings.py      # SentenceTransformer loader/encoder
|   |-- vector_store.py    # FAISS IndexFlatL2 wrapper with metadata arrays
|   |-- pdf_parser.py      # pdfplumber text extraction utility
|   `-- openrouter_llm.py  # OpenRouter API client (GPT-4o mini default)
|-- storage/               # Uploaded PDFs served via /files (created at runtime)
`-- .venv/                 # Local virtual environment (artifact, gitignored in practice)
```

## Frontend Overview
- Located in `frontend/` with Vite 7, React 19, Tailwind CSS 4, and Axios.
- `src/api/client.js` centralizes the Axios instance and supports `VITE_API_BASE_URL` override (defaults to `http://localhost:8000`).
- `src/components/Sidebar.jsx` handles upload, listing, deletion, selection, PDF viewing, and summary triggering.
- `src/components/Chat.jsx` manages the conversational UI, enforces document selection before sending, and displays LLM answers plus source chips.
- `src/components/SummaryModal.jsx` renders Markdown summaries with document metadata badges.
- Builds live under `frontend/dist/`; Tailwind setup lives in `tailwind.config.js` and `src/index.css` applies base styles.

## Document Processing Flow
1. **Upload:** `/documents/upload` sanitizes and normalizes the incoming filename, stores the PDF in `backend/storage/`, extracts text via pdfplumber, and splits it into sections.
2. **Post-process:** Sections shorter than `min_chars` are merged with the prior section to avoid noisy chunks.
3. **Type detection:** Keyword heuristics label the document type and store it in `DOCUMENT_METADATA`.
4. **Embedding + Indexing:** `indexing_agent` encodes each section with `SentenceTransformer("all-MiniLM-L6-v2")`, storing embeddings inside a FAISS `IndexFlatL2` plus parallel text/metadata arrays.
5. **Memory update:** `DOCUMENT_INDEX` and `DOCUMENT_METADATA` (module-level dicts) retain indexes and descriptive stats for subsequent requests.
6. **Retrieval & QA:** `/documents/ask-selected` embeds the question, runs FAISS search per selected document, and feeds the top sections to `qa_agent`, which prompts the OpenRouter LLM.
7. **Summaries:** `/documents/summaries/{filename}` re-parses the document, selects a prompt template based on type, and summarizes up to ten sections for the UI modal.
8. **Static serve:** PDFs remain accessible under `/files/<filename>` via FastAPI's `StaticFiles` mount for manual review.

## Long-Term Memory & Vector Store
- `core/document_memory.py` houses two dictionaries: `DOCUMENT_INDEX` (document name -> `VectorStore`) and `DOCUMENT_METADATA` (document name -> counts/type info). They live purely in memory, so restarts clear all indexes until documents are reprocessed.
- `VectorStore` wraps a FAISS `IndexFlatL2`, storing embeddings in native arrays plus Python lists for the raw text and metadata (section id/title). Search returns tuples `(distance, text, metadata)` used directly by QA and summarization flows.
- `core/embeddings.py` memoizes the SentenceTransformer model to avoid repeated weight loads.
- Lazy indexing in `api/ask.py` rebuilds indexes on demand if a stored PDF has not yet been embedded during the current run.

## API Endpoints
| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/documents/upload` | Accepts a PDF (`UploadFile`), saves it, runs extraction, sectioning, indexing, and type detection. |
| `DELETE` | `/documents/{filename}` | Removes the PDF from storage and clears corresponding in-memory state. |
| `GET` | `/documents/list` | Lists PDFs in storage, ensuring metadata exists (re-detecting type when missing). |
| `GET` | `/documents/sections/{filename}` | Returns section id/title/length after re-running sectioning for transparency. |
| `GET` | `/documents/summaries/{filename}` | Generates summaries for up to ten sections with doc-type-aware prompts. |
| `POST` | `/documents/ask-selected` | Accepts `{"question": str, "documents": [str]}`, performs per-document retrieval, and returns the LLM answer plus source metadata. |
| `POST` | `/documents/ask_all` | Searches across all in-memory indexes and returns an answer plus cited section metadata. |
| `GET` | `/files/{filename}` | Serves stored PDFs directly via FastAPI's StaticFiles mount. |

## Tech Stack
- **Backend:** Python 3.11+, FastAPI, Uvicorn, Pydantic, python-multipart, pdfplumber, sentence-transformers, faiss-cpu, NumPy, OpenAI SDK (configured for OpenRouter), CORS middleware.
- **Frontend:** Node 18+, Vite, React 19, Tailwind CSS 4, Axios, clsx, Lucide React icons, React Markdown.
- **Storage:** Local filesystem directory (`backend/storage/`).

## How to Run Locally
### Backend
```bash
cd backend
python -m venv .venv
# Activate
# PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
# source .venv/bin/activate
pip install -r requirements.txt
set OPENROUTER_API_KEY=sk-your-key   # export on Unix shells
uvicorn main:app --reload --port 8000
```
The server automatically creates `storage/` (if missing) and exposes it at `http://localhost:8000/files`.

### Frontend
```bash
cd frontend
npm install
npm run dev -- --port 3000
```
The backend CORS configuration reads `ALLOWED_ORIGINS` (comma-separated) and defaults to `http://localhost:3000`. For production builds, run `npm run build` and serve `frontend/dist/` via any static host.

## Environment Variables
| Variable | Required | Description |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | Yes | Used by `core/openrouter_llm.py` to authenticate with OpenRouter before calling chat completions. |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins for FastAPI (default: `http://localhost:3000`). |
| `VITE_API_BASE_URL` | No | Frontend API base URL override (default: `http://localhost:8000`). |

## Future Improvements
- Persist embeddings and metadata in external storage (database or vector DB) so restarts do not require re-indexing.
- Harden file uploads further with stricter validation (size/MIME checks) and antivirus scanning for untrusted inputs.
- Add filename safety checks to delete/list endpoints for complete path-traversal defense-in-depth.
- Add automated tests plus CI workflows covering sectioning heuristics, indexing, and API contracts.
- Consider streaming responses to the frontend and exposing retrieval scores directly in the UI.

## License
Specify license terms here (e.g., MIT, Apache 2.0) once chosen.
