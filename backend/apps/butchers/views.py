"""
Views for butchers app.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.accounts.permissions import IsButcher
from .models import ButcherProfile, Appointment
from .serializers import ButcherProfileSerializer, AppointmentSerializer


class IsOwnerOrReadOnly(IsAuthenticated):
    """
    Object-level permission to only allow owners of an object to edit it.
    Assumes the model instance has an `user` attribute.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True

        # Instance must have an attribute named `user`.
        return obj.user == request.user


class ButcherProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for butcher profiles.
    
    - LIST: View all active butchers
    - CREATE: Create own butcher profile (IsButcher)
    - RETRIEVE: View butcher details
    - UPDATE: Update own profile
    - ME: Get own profile
    """
    
    serializer_class = ButcherProfileSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'put', 'head', 'options']
    
    def get_queryset(self):
        """
        Return active butcher profiles.
        
        Can filter by city.
        """
        queryset = ButcherProfile.objects.select_related('user')
        
        # Filter by active status unless it's the owner viewing their own
        if self.action in ['list', 'retrieve']:
             # For general viewing, show only active. 
             # Ideally we might struggle if an owner wants to see their inactive profile via ID.
             # But 'me' endpoint handles that separately.
             queryset = queryset.filter(is_active=True)
        
        # Filter by city if provided
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        return queryset
    
    def get_permissions(self):
        """
        Set permissions based on action.
        Public read access for list/retrieve.
        """
        from rest_framework.permissions import AllowAny
        
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        elif self.action == 'create':
            permission_classes = [IsAuthenticated, IsButcher]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    

    def create(self, request, *args, **kwargs):
        """
        Create own butcher profile.
        Enforces 1 profile per user rule.
        """
        # Check if user already has a profile
        if ButcherProfile.objects.filter(user=request.user).exists():
            return Response(
                {
                    "error": {
                        "code": "BUTCHER_PROFILE_ALREADY_EXISTS",
                        "message": "Zaten bir kasap ilanınız var. Yeni ilan oluşturamazsınız."
                    }
                },
                status=status.HTTP_409_CONFLICT
            )
            
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        """
        Auto-assign user when creating profile.
        """
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Get current user's butcher profile.
        """
        try:
            profile = ButcherProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except ButcherProfile.DoesNotExist:
            return Response(None) # Return null if no profile exists


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for appointments.
    
    - LIST: View appointments (filtered by role)
    - CREATE: Create appointment request
    - approve/reject/cancel: Status change actions
    """
    
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']  # No PUT/PATCH/DELETE
    
    def get_queryset(self):
        """
        Return appointments based on user role.
        
        - If BUTCHER: appointments for their profile
        - Else: appointments created by user
        """
        user = self.request.user
        
        # Check if user has butcher profile
        try:
            butcher_profile = user.butcher_profile
            return Appointment.objects.filter(butcher=butcher_profile).select_related(
                'butcher', 'user', 'listing'
            )
        except ButcherProfile.DoesNotExist:
            # Regular user, show their appointments
            return Appointment.objects.filter(user=user).select_related(
                'butcher', 'user', 'listing'
            )
    
    def perform_create(self, serializer):
        """
        Auto-assign user when creating appointment.
        """
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsButcher])
    def approve(self, request, pk=None):
        """
        Approve appointment (butcher only).
        """
        appointment = self.get_object()
        
        # Verify butcher owns this appointment
        if appointment.butcher.user != request.user:
            return Response(
                {'error': 'You can only approve appointments for your profile.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if appointment.status != Appointment.PENDING:
            return Response(
                {'error': 'Only pending appointments can be approved.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.approve()
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsButcher])
    def reject(self, request, pk=None):
        """
        Reject appointment (butcher only).
        """
        appointment = self.get_object()
        
        # Verify butcher owns this appointment
        if appointment.butcher.user != request.user:
            return Response(
                {'error': 'You can only reject appointments for your profile.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if appointment.status != Appointment.PENDING:
            return Response(
                {'error': 'Only pending appointments can be rejected.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.reject()
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel appointment (customer only).
        """
        appointment = self.get_object()
        
        # Verify user owns this appointment
        if appointment.user != request.user:
            return Response(
                {'error': 'You can only cancel your own appointments.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if appointment.status not in [Appointment.PENDING, Appointment.APPROVED]:
            return Response(
                {'error': 'Only pending or approved appointments can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.cancel()
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
