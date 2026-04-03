"""
Hashids mixin for DRF ViewSets.

Decodes hashed IDs from URL kwargs before performing DB lookups.
Handles 404 gracefully for invalid hashes.
"""
from rest_framework.exceptions import NotFound
from .hashids_util import decode_id


class HashidsMixin:
    """
    Mixin that decodes a hashed 'pk' URL kwarg before any DB lookup.

    Usage:
        class MyViewSet(HashidsMixin, viewsets.ModelViewSet):
            ...
    """

    def get_object(self):
        # Decode hashed pk if present
        pk = self.kwargs.get('pk')
        if pk and not str(pk).isdigit():
            decoded = decode_id(pk)
            if decoded is None:
                raise NotFound('Geçersiz kayıt ID.')
            self.kwargs['pk'] = decoded
        return super().get_object()
