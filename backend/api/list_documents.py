import os
from fastapi import APIRouter

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

from core.document_memory import DOCUMENT_METADATA
from core.pdf_parser import extract_text_from_pdf
from agents.document_type_agent import detect_document_type

@router.get("/list")
def list_documents():
    docs = []
    if os.path.exists("storage"):
        for f in os.listdir("storage"):
            if f.endswith(".pdf"):
                # If metadata missing, re-detect!
                if f not in DOCUMENT_METADATA:
                     # Calculate full path
                    file_path = os.path.join("storage", f)
                    try:
                        text = extract_text_from_pdf(file_path)
                        doc_type_info = detect_document_type(text)
                        
                        # Re-index if needed (optional, but good for consistency)
                        # sections = split_into_sections(text) ... (skipping heavy indexing for now, just metadata)
                        
                        DOCUMENT_METADATA[f] = {
                            "type": doc_type_info.get("type", "Unknown"),
                            "num_sections": 0 # We don't know this yet without full parse, but Type is key
                        }
                    except Exception as e:
                        print(f"Error auto-detecting {f}: {e}")

                meta = DOCUMENT_METADATA.get(f, {})
                docs.append({
                    "name": f,
                    "type": meta.get("type", "Unknown"),
                    "num_sections": meta.get("num_sections", 0)
                })
    return {"documents": docs}
