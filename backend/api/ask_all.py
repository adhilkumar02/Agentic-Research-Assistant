from fastapi import APIRouter
from pydantic import BaseModel

from core.document_memory import DOCUMENT_INDEX
from core.embeddings import embed_text
from agents.qa_agent import answer_question
from core.openrouter_llm import openrouter_llm

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


class AskAllRequest(BaseModel):
    question: str


@router.post("/ask_all")
def ask_all_documents(req: AskAllRequest):
    if not DOCUMENT_INDEX:
        return {"error": "No documents indexed"}

    question_embedding = embed_text(req.question)

    retrieved = []
    for filename, store in DOCUMENT_INDEX.items():
        if not store:
            continue

        hits = store.search(question_embedding, k=2)
        for score, text, metadata in hits:
            enriched_meta = {**metadata, "document": filename}
            retrieved.append((score, text, enriched_meta))

    if not retrieved:
        return {
            "question": req.question,
            "answer": "No relevant content found in indexed documents.",
            "sources": [],
        }

    answer = answer_question(req.question, retrieved, openrouter_llm)

    return {
        "question": req.question,
        "answer": answer,
        "sources": [
            {
                "document": metadata.get("document"),
                "section_id": metadata.get("section_id"),
                "title": metadata.get("title"),
                "score": score,
            }
            for score, _, metadata in retrieved
        ]
    }
