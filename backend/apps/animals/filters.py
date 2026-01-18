"""
Filters for animals app.
"""

import django_filters
from .models import AnimalListing


class AnimalListingFilter(django_filters.FilterSet):
    """
    FilterSet for AnimalListing model.
    
    Provides filtering by:
    - animal_type (supports both legacy and Turkish codes, grouping)
    - price range (min_price, max_price)
    - location (case-insensitive partial match)
    - age range (min_age, max_age)
    - weight range (min_weight, max_weight)
    """
    
    animal_type = django_filters.CharFilter(
        method='filter_animal_type',
        help_text="Filter by animal type (supports KUCUKBAS/BUYUKBAS/SMALL/LARGE/SMALL_GROUP/LARGE_GROUP)"
    )
    
    def filter_animal_type(self, queryset, name, value):
        """
        Custom filter method for animal_type that handles:
        - Legacy codes: SMALL, LARGE
        - Turkish codes: KUCUKBAS, BUYUKBAS
        - Group codes: SMALL_GROUP, LARGE_GROUP
        
        Maps any variant to appropriate __in filter to catch all database values.
        """
        if not value:
            return queryset
        
        v = value.upper().strip()
        print(f"[DEBUG] Animal type filter received: '{value}' → normalized: '{v}'")
        
        # Map to small group (Küçükbaş)
        if v in ('SMALL_GROUP', 'KUCUKBAS', 'SMALL'):
            print(f"[DEBUG] Filtering for SMALL group: ['SMALL', 'KUCUKBAS']")
            return queryset.filter(animal_type__in=['SMALL', 'KUCUKBAS'])
        
        # Map to large group (Büyükbaş)
        if v in ('LARGE_GROUP', 'BUYUKBAS', 'LARGE'):
            print(f"[DEBUG] Filtering for LARGE group: ['LARGE', 'BUYUKBAS']")
            return queryset.filter(animal_type__in=['LARGE', 'BUYUKBAS'])
        
        # Fallback: exact match (shouldn't normally happen)
        print(f"[DEBUG] Using exact match fallback for: '{v}'")
        return queryset.filter(animal_type=value)
    
    min_price = django_filters.NumberFilter(
        field_name='price',
        lookup_expr='gte',
        help_text="Minimum price"
    )
    max_price = django_filters.NumberFilter(
        field_name='price',
        lookup_expr='lte',
        help_text="Maximum price"
    )
    
    location = django_filters.CharFilter(
        field_name='location',
        lookup_expr='icontains',
        help_text="Filter by location (partial match, case-insensitive)"
    )
    
    min_age = django_filters.NumberFilter(
        field_name='age',
        lookup_expr='gte',
        help_text="Minimum age in months"
    )
    max_age = django_filters.NumberFilter(
        field_name='age',
        lookup_expr='lte',
        help_text="Maximum age in months"
    )
    
    min_weight = django_filters.NumberFilter(
        field_name='weight',
        lookup_expr='gte',
        help_text="Minimum weight in kg"
    )
    max_weight = django_filters.NumberFilter(
        field_name='weight',
        lookup_expr='lte',
        help_text="Maximum weight in kg"
    )
    
    class Meta:
        model = AnimalListing
        fields = [
            'animal_type',
            'min_price',
            'max_price',
            'location',
            'min_age',
            'max_age',
            'min_weight',
            'max_weight'
        ]
