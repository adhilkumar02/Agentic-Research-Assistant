from core.embeddings import embed_text
from core.vector_store import VectorStore

def build_section_index(sections):
    if not sections:
        return None

    dim = len(embed_text(sections[0]["content"]))
    store = VectorStore(dim)

    for sec in sections:
        embedding = embed_text(sec["content"])
        store.add(
            embedding,
            sec["content"],
            {
                "section_id": sec["id"],
                "title": sec["title"]
            }
        )

    return store
