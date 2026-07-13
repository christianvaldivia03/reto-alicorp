"""Hasher de contraseñas con pbkdf2 (stdlib, sin dependencias externas).

ponytail: pbkdf2_hmac de hashlib cubre el MVP. Si se requiere endurecer,
migrar a argon2/bcrypt cambiando solo este adaptador.
"""
import base64
import hashlib
import hmac
import os

_ITER = 200_000


class Pbkdf2Hasher:
    def hash(self, pw: str) -> str:
        salt = os.urandom(16)
        dk = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt, _ITER)
        return base64.b64encode(salt + dk).decode()

    def verify(self, pw: str, stored: str) -> bool:
        raw = base64.b64decode(stored.encode())
        salt, dk = raw[:16], raw[16:]
        cand = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt, _ITER)
        return hmac.compare_digest(dk, cand)
