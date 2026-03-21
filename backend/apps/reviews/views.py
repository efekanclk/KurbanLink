"""
Views for reviews app.

Endpoints:
  GET    /api/reviews/butchers/<butcher_id>/    – list all reviews for a butcher (public)
  POST   /api/reviews/butchers/<butcher_id>/    – submit a review (auth required)
  GET    /api/reviews/butchers/<butcher_id>/me/ – get current user's review for this butcher
  PUT    /api/reviews/butchers/<butcher_id>/me/ – update own review
  DELETE /api/reviews/butchers/<butcher_id>/me/ – delete own review
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from apps.butchers.models import ButcherProfile
from .models import ButcherReview
from .serializers import ButcherReviewSerializer


class ButcherReviewListCreateView(APIView):
    """
    GET  – list all reviews for a butcher (no auth required).
    POST – submit a new review (auth required, one per user per butcher).
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, butcher_id):
        butcher = get_object_or_404(ButcherProfile, pk=butcher_id)
        reviews = ButcherReview.objects.filter(butcher=butcher).select_related('user')
        serializer = ButcherReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def post(self, request, butcher_id):
        butcher = get_object_or_404(ButcherProfile, pk=butcher_id)

        # A user cannot review their own profile
        if butcher.user == request.user:
            return Response(
                {'error': 'Kendi profilinize puan veremezsiniz.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # One review per (user, butcher)
        if ButcherReview.objects.filter(butcher=butcher, user=request.user).exists():
            return Response(
                {'error': 'Bu kasaba zaten puan verdiniz. Puanınızı güncellemek için PUT kullanın.'},
                status=status.HTTP_409_CONFLICT
            )

        serializer = ButcherReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(butcher=butcher, user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ButcherReviewMeView(APIView):
    """
    Manage the current user's review for a specific butcher.

    GET    – retrieve own review
    PUT    – update own review (full update)
    PATCH  – update own review (partial update)
    DELETE – delete own review
    """

    permission_classes = [IsAuthenticated]

    def _get_review(self, request, butcher_id):
        butcher = get_object_or_404(ButcherProfile, pk=butcher_id)
        return get_object_or_404(ButcherReview, butcher=butcher, user=request.user)

    def get(self, request, butcher_id):
        review = self._get_review(request, butcher_id)
        serializer = ButcherReviewSerializer(review)
        return Response(serializer.data)

    def put(self, request, butcher_id):
        review = self._get_review(request, butcher_id)
        serializer = ButcherReviewSerializer(review, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request, butcher_id):
        review = self._get_review(request, butcher_id)
        serializer = ButcherReviewSerializer(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, butcher_id):
        review = self._get_review(request, butcher_id)
        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
