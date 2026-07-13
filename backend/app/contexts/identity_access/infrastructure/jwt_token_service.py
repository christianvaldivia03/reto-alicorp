"""Servicio de tokens JWT (HS256, PyJWT)."""
from datetime import datetime, timedelta, timezone

import jwt

from app.config import get_settings


class JwtTokenService:
    def __init__(self, secret: str | None = None):
        self._secret = secret or get_settings().jwt_secret

    def issue(self, sub: str, rol: str, ttl_min: int = 120) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": sub,
            "rol": rol,
            "iat": now,
            "exp": now + timedelta(minutes=ttl_min),
        }
        return jwt.encode(payload, self._secret, algorithm="HS256")

    def verify(self, token: str) -> dict:
        # jwt.decode lanza ExpiredSignatureError / InvalidTokenError si falla.
        return jwt.decode(token, self._secret, algorithms=["HS256"])
