import json
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

def get_answer_key_fernet():
    key = settings.ANSWER_KEY_ENCRYPTION_KEY
    if not key:
        raise ImproperlyConfigured("ANSWER_KEY_ENCRYPTION_KEY is not configured.")
    try:
        return Fernet(key.encode("ascii"))
    except (ValueError, TypeError, UnicodeEncodeError) as exc:
        raise ImproperlyConfigured("Invalid Fernet encryption key.") from exc

def encrypt_answer_key(payload):
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")
    return get_answer_key_fernet().encrypt(raw)

def decrypt_answer_key(ciphertext, key_version):
    if key_version != settings.ANSWER_KEY_KEY_VERSION:
        raise ImproperlyConfigured("Answer key version does not match configured version.")
    try:
        raw = get_answer_key_fernet().decrypt(bytes(ciphertext))
    except InvalidToken as exc:
        raise ValueError("Unable to decrypt answer key.") from exc
    return json.loads(raw.decode("utf-8"))
