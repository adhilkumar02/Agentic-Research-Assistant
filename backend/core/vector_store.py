import faiss
import numpy as np


class VectorStore:
    def __init__(self, dim: int):
        self.index = faiss.IndexFlatL2(dim)
        self.texts = []
        self.metadata = []

    def add(self, embedding, text, meta):
        self.index.add(np.array([embedding]).astype("float32"))
        self.texts.append(text)
        self.metadata.append(meta)

    def search(self, embedding, k=3):
        distances, indices = self.index.search(
            np.array([embedding]).astype("float32"), k
        )

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(self.texts):
                results.append(
                    (
                        float(dist),
                        self.texts[idx],
                        self.metadata[idx]
                    )
                )

        return results

