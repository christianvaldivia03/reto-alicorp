"""Adaptador VisionPort con Gemini (generateContent multimodal, REST)."""
import base64
import json

import httpx

from app.config import get_settings
from app.contexts.brand_identity.domain.models import BrandRule

_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


class GeminiVision:
    def audit(self, image: bytes, mime: str, rules: list[BrandRule]) -> tuple[str, str]:
        s = get_settings()
        reglas = "\n".join(f"- {r.texto}" for r in rules) or "- (sin reglas)"
        prompt = (
            "Eres un auditor de identidad de marca. Contrasta la imagen adjunta "
            "contra estas reglas del manual de marca:\n"
            f"{reglas}\n\n"
            'Responde SOLO un JSON: {"veredicto": "CUMPLE" | "NO_CUMPLE", '
            '"motivo": "explicación breve; si NO_CUMPLE indica qué regla se viola"}.'
        )
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {"inline_data": {"mime_type": mime, "data": base64.b64encode(image).decode()}},
                    ]
                }
            ],
            "generationConfig": {"response_mime_type": "application/json"},
        }
        r = httpx.post(
            _URL.format(model=s.vision_model),
            params={"key": s.google_api_key},
            json=payload,
            timeout=60,
        )
        r.raise_for_status()
        text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
        data = json.loads(text)
        veredicto = "CUMPLE" if str(data.get("veredicto", "")).upper() == "CUMPLE" else "NO_CUMPLE"
        return veredicto, str(data.get("motivo", ""))
