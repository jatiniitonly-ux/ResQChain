import os
from datetime import datetime, timedelta, timezone
from hashlib import sha256

JWT_SECRET = os.getenv('JWT_SECRET', 'development-only-secret')

def hash_password(password: str) -> str:
    return sha256((JWT_SECRET + password).encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash

def session_claims(user_id: str, role: str) -> dict[str, str]:
    return {'sub': user_id, 'role': role, 'exp': (datetime.now(timezone.utc) + timedelta(hours=8)).isoformat()}
