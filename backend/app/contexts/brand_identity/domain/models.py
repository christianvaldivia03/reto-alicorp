"""Modelo de dominio del contexto Brand Identity."""
import json
from dataclasses import dataclass, field
from enum import Enum

from app.shared.errors import DomainError


class RuleType(str, Enum):
    PROHIBICION = "PROHIBICION"
    RECOMENDACION = "RECOMENDACION"
    OBLIGACION = "OBLIGACION"


@dataclass(frozen=True)
class BrandParameters:
    """Parámetros de entrada de la marca. Value Object inmutable y validado.

    Los 3 primeros son obligatorios; `extras` son parámetros dinámicos opcionales
    (label -> valor) que el usuario añade y que enriquecen el prompt del manual.
    `compare=False` evita romper hash/eq con un dict."""

    categoria: str
    tono: str
    publico: str
    extras: dict[str, str] = field(default_factory=dict, compare=False)

    def __post_init__(self):
        for nombre, valor in (("categoria", self.categoria), ("tono", self.tono), ("publico", self.publico)):
            if not valor or not valor.strip():
                raise DomainError(f"BrandParameters.{nombre} no puede estar vacío")


@dataclass(frozen=True)
class BrandRule:
    """Una regla concreta del manual de marca. Value Object."""

    categoria: str
    texto: str
    tipo: RuleType
    # id de la fila en brand_rules. Solo lo rellena el repo al leer de BD (para
    # poder editarla); es None al generar. compare=False → no afecta igualdad.
    id: int | None = field(default=None, compare=False)

    def __post_init__(self):
        if not self.texto or not self.texto.strip():
            raise DomainError("BrandRule.texto no puede estar vacío")


@dataclass(frozen=True)
class BrandSummary:
    """Vista ligera del manual para listados/selectores: sin reglas ni
    embeddings. Evita cargar el agregado completo solo para pintar un combo."""

    id: str
    parametros: BrandParameters
    estado: str = "ACTIVO"


@dataclass
class BrandManual:
    """Agregado raíz: el manual de marca. Es la fuente de verdad."""

    id: str
    parametros: BrandParameters
    reglas: list[BrandRule]
    estado: str = "ACTIVO"

    def __post_init__(self):
        if not self.reglas:
            raise DomainError("Un BrandManual debe tener al menos una regla")


def parse_rules(raw: str) -> list[BrandRule]:
    """Convierte la salida JSON del LLM en reglas de dominio. Lanza
    DomainError si el formato es inválido."""
    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, TypeError) as e:
        raise DomainError(f"Respuesta del LLM no es JSON válido: {e}") from e
    # El LLM puede envolver la lista en un objeto: {"reglas": [...]}
    if isinstance(data, dict):
        listas = [v for v in data.values() if isinstance(v, list)]
        if len(listas) != 1:
            raise DomainError("Objeto sin una única lista de reglas")
        data = listas[0]
    if not isinstance(data, list):
        raise DomainError("Se esperaba una lista de reglas")
    reglas: list[BrandRule] = []
    for item in data:
        try:
            reglas.append(
                BrandRule(
                    categoria=item["categoria"],
                    texto=item["texto"],
                    tipo=RuleType(item["tipo"]),
                )
            )
        except (KeyError, ValueError, TypeError) as e:
            raise DomainError(f"Regla con formato inválido: {item!r} ({e})") from e
    return reglas
