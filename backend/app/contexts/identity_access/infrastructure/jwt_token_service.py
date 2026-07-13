"""Servicio de tokens JWT (HS256, PyJWT).

Emite dos tipos de token: `access` (corta vida, se manda en cada request) y
`refresh` (larga vida, sirve para renovar el access sin re-login). El claim
`type` los distingue para que un refresh no se acepte como access ni viceversa.
"""
from datetime import datetime, timedelta, timezone

import jwt

from app.config import get_settings

_REFRESH_TTL_MIN = 60 * 24 * 7  # 7 días


class JwtTokenService:
    def __init__(self, secret: str | None = None):
        self._secret = secret or get_settings().jwt_secret

    def issue(self, sub: str, rol: str, ttl_min: int = 120) -> str:
        return self._encode({"sub": sub, "rol": rol, "type": "access"}, ttl_min)

    def issue_refresh(self, sub: str, ttl_min: int = _REFRESH_TTL_MIN) -> str:
        return self._encode({"sub": sub, "type": "refresh"}, ttl_min)

    def _encode(self, claims: dict, ttl_min: int) -> str:
        now = datetime.now(timezone.utc)
        payload = {**claims, "iat": now, "exp": now + timedelta(minutes=ttl_min)}
        return jwt.encode(payload, self._secret, algorithm="HS256")

    def verify(self, token: str) -> dict:
        # jwt.decode lanza ExpiredSignatureError / InvalidTokenError si falla.
        return jwt.decode(token, self._secret, algorithms=["HS256"])
