"""Adaptador de generación de texto con Groq (Llama 3). Implementa TextLlmPort."""
from groq import Groq

from app.config import get_settings


class GroqTextLlm:
    def __init__(self, json_mode: bool = False):
        s = get_settings()
        self._client = Groq(api_key=s.groq_api_key)
        self._model = s.groq_model
        # json_mode=True fuerza salida JSON (Fase 1: manual). Para texto libre
        # (Fase 2: contenido) se deja en False.
        self._json_mode = json_mode

    def generate(self, prompt: str) -> str:
        kwargs = {}
        if self._json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        r = self._client.chat.completions.create(
            model=self._model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            **kwargs,
        )
        return r.choices[0].message.content
