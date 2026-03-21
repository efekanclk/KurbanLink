"""
URL patterns for reviews app.
"""

from django.urls import path
from .views import ButcherReviewListCreateView, ButcherReviewMeView

urlpatterns = [
    # List all reviews for a butcher / submit a new review
    path('butchers/<int:butcher_id>/', ButcherReviewListCreateView.as_view(), name='butcher-reviews'),

    # Current user's own review for a butcher (get / update / delete)
    path('butchers/<int:butcher_id>/me/', ButcherReviewMeView.as_view(), name='butcher-review-me'),
]
