"""Servicio de dominio: backstop determinista de cumplimiento de marca.

El filtrado principal lo hace el LLM con las reglas inyectadas en el prompt
(contexto recuperado del RAG). Este guard es una red de seguridad para una
lista negra explícita de términos.

ponytail: denylist literal, suficiente para el MVP. Si se necesita chequeo
semántico, se sube a un verificador con LLM en un segundo paso.
"""


class BrandComplianceGuard:
    @staticmethod
    def check(texto: str, prohibited_terms: list[str]) -> list[str]:
        low = texto.lower()
        return [t for t in prohibited_terms if t.lower() in low]
