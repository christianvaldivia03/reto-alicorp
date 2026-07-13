"""Adaptador de embeddings con Gemini (REST). Implementa el modelo de
embeddings que usa el vector store para el RAG."""
import httpx

from app.config import get_settings

_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent"


class GeminiEmbedder:
    def embed(self, text: str) -> list[float]:
        s = get_settings()
        r = httpx.post(
            _URL.format(model=s.embedding_model),
            params={"key": s.google_api_key},
            json={
                "content": {"parts": [{"text": text}]},
                "outputDimensionality": s.embedding_dim,
            },
            timeout=30,
        )
        r.raise_for_status()
        return r.json()["embedding"]["values"]
