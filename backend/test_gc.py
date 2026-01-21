from apps.partnerships.models import PartnershipListing
from apps.messages.models import GroupConversation

p = PartnershipListing.objects.get(id=1)
print(f"Partnership: {p.city}")
print(f"Has group_conversation attr: {hasattr(p, 'group_conversation')}")

try:
    gc = p.group_conversation
    print(f"GroupConversation exists: {gc}")
except Exception as e:
    print(f"Error accessing group_conversation: {type(e).__name__}: {e}")
