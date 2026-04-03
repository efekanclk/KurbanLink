"""
Central hashids utility for URL ID obfuscation.

Use the same SALT and MIN_LENGTH as the frontend utils/hashids.js.
"""
from hashids import Hashids

SALT = 'KurbanLink2024!xZ9q'
MIN_LENGTH = 7

_hashids = Hashids(salt=SALT, min_length=MIN_LENGTH)


def encode_id(pk: int) -> str:
    """Encode a numeric primary key to a URL-safe hash string."""
    if pk is None:
        return None
    return _hashids.encode(pk)


def decode_id(hash_str: str) -> int | None:
    """Decode a hash string back to a numeric primary key. Returns None if invalid."""
    if not hash_str:
        return None
    try:
        decoded = _hashids.decode(hash_str)
        return decoded[0] if decoded else None
    except Exception:
        return None
