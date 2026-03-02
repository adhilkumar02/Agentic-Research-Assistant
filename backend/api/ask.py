import os
from typing import List

from fastapi import APIRouter
from pydantic import BaseModel

from agents.document_type_agent import detect_document_type
from agents.indexing_agent import build_section_index
from agents.qa_agent import answer_question
from agents.section_postprocessor import merge_small_sections
from agents.sectioning_agent import split_into_sections
from core.document_memory import DOCUMENT_INDEX, DOCUMENT_METADATA
from core.embeddings import embed_text
from core.openrouter_llm import openrouter_llm
from core.pdf_parser import extract_text_from_pdf

router = APIRouter(prefix="/documents", tags=["Documents"])


class AskSelectedRequest(BaseModel):
    question: str
    documents: List[str]


@router.post("/ask-selected")
def ask_selected_documents(req: AskSelectedRequest):
    """
    Ask a question from selected documents only.
    """
    retrieved_sections = []
    query_embedding = embed_text(req.question)

    for doc in req.documents:
        store = DOCUMENT_INDEX.get(doc)

        # Lazy indexing: if missing from memory but present on disk, index on demand.
        if not store:
            file_path = os.path.join("storage", doc)
            if os.path.exists(file_path):
                try:
                    text = extract_text_from_pdf(file_path)
                    sections = split_into_sections(text)
                    sections = merge_small_sections(sections, min_chars=300)
                    index = build_section_index(sections)

                    DOCUMENT_INDEX[doc] = index

                    if doc not in DOCUMENT_METADATA:
                        doc_type_info = detect_document_type(text)
                        DOCUMENT_METADATA[doc] = {
                            "num_sections": len(sections),
                            "type": doc_type_info.get("type", "Unknown"),
                        }

                    store = index
                except Exception:
                    continue

        if not store:
            continue

        # Vector search returns tuples: (score, text, metadata).
        # Add source document so the UI can render citations reliably.
        for score, text, metadata in store.search(query_embedding, k=5):
            enriched_meta = {**metadata, "document": doc}
            retrieved_sections.append((score, text, enriched_meta))

    if not retrieved_sections:
        return {
            "question": req.question,
            "answer": "No relevant content found in selected documents.",
            "documents_used": req.documents,
        }

    answer = answer_question(
        question=req.question,
        retrieved_sections=retrieved_sections,
        llm_callable=openrouter_llm,
    )

    sources = []
    for score, _, metadata in retrieved_sections:
        sources.append(
            {
                "document": metadata.get("document"),
                "section_id": metadata.get("section_id"),
                "title": metadata.get("title"),
                "score": score,
            }
        )

    return {
        "question": req.question,
        "answer": answer,
        "documents_used": req.documents,
        "sources": sources,
    }
