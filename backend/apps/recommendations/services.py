"""
Service layer for generating recommendations.

Rule-based recommendation engine using user behavior data.
"""

from typing import List, Tuple
from django.db.models import Q, Count
from apps.animals.models import AnimalListing
from apps.favorites.models import Favorite
from apps.accounts.models import User
from .models import Recommendation


class RecommendationService:
    """
    Service for generating rule-based recommendations.
    """
    
    def __init__(self, user: User):
        self.user = user
        self.recommendations = []
    
    def generate_all(self) -> List[Recommendation]:
        """
        Generate all types of recommendations for the user.
        
        Returns:
            List of Recommendation instances (not saved)
        """
        self.recommendations = []
        
        # Generate each type
        self._generate_animal_recommendations()
        self._generate_seller_recommendations()
        self._generate_butcher_recommendations()
        
        return self.recommendations
    
    def _generate_animal_recommendations(self) -> None:
        """
        Generate animal listing recommendations based on:
        - Similar animal_type to favorites
        - Similar location
        - Price proximity (+/- 20%)
        """
        # Get user's favorites
        favorites = Favorite.objects.filter(
            user=self.user
        ).select_related('animal')
        
        if not favorites.exists():
            # No favorites, recommend popular listings
            self._recommend_popular_animals()
            return
        
        # Extract favorite animal types, locations, and price ranges
        favorite_listings = [f.animal for f in favorites]
        favorite_types = set(l.animal_type for l in favorite_listings)
        favorite_locations = set(l.location for l in favorite_listings)
        
        # Calculate average price
        prices = [l.price for l in favorite_listings]
        avg_price = sum(prices) / len(prices) if prices else 0
        price_min = avg_price * 0.8
        price_max = avg_price * 1.2
        
        # Find similar listings
        candidates = AnimalListing.objects.filter(
            is_active=True
        ).exclude(
            id__in=[f.animal.id for f in favorites]  # Exclude favorited
        ).exclude(
            seller=self.user  # Exclude own listings
        ).select_related('seller')
        
        for listing in candidates[:20]:  # Limit candidates
            score = 0.0
            reasons = []
            
            # Score based on animal type match
            if listing.animal_type in favorite_types:
                score += 50
                reasons.append("similar type")
            
            # Score based on location match
            if listing.location in favorite_locations:
                score += 30
                reasons.append("same area")
            
            # Score based on price proximity
            if price_min <= listing.price <= price_max:
                score += 20
                reasons.append("similar price")
            
            if score > 0:
                reason = f"Based on your favorites: {', '.join(reasons)}"
                self.recommendations.append(
                    Recommendation(
                        user=self.user,
                        type=Recommendation.ANIMAL,
                        object_id=listing.id,
                        score=score,
                        reason=reason
                    )
                )
    
    def _recommend_popular_animals(self) -> None:
        """
        Recommend popular listings (fallback when no favorites).
        """
        popular = AnimalListing.objects.filter(
            is_active=True
        ).exclude(
            seller=self.user
        ).annotate(
            favorite_count=Count('favorites')
        ).order_by('-favorite_count')[:10]
        
        for listing in popular:
            self.recommendations.append(
                Recommendation(
                    user=self.user,
                    type=Recommendation.ANIMAL,
                    object_id=listing.id,
                    score=30.0,
                    reason="Popular listing"
                )
            )
    
    def _generate_seller_recommendations(self) -> None:
        """
        Generate seller recommendations based on:
        - Sellers with listings matching user's favorite animal types
        - Sellers in user's preferred locations
        """
        # Get user's favorites
        favorites = Favorite.objects.filter(
            user=self.user
        ).select_related('animal')
        
        if not favorites.exists():
            return
        
        favorite_listings = [f.animal for f in favorites]
        favorite_types = set(l.animal_type for l in favorite_listings)
        favorite_locations = set(l.location for l in favorite_listings)
        
        # Find sellers with matching listings
        sellers = User.objects.filter(
            animal_listings__is_active=True,
            animal_listings__animal_type__in=favorite_types
        ).exclude(
            id=self.user.id
        ).distinct().annotate(
            listing_count=Count('animal_listings')
        )[:10]
        
        for seller in sellers:
            score = 40.0
            reasons = []
            
            # Check if seller has listings in favorite locations
            has_location_match = seller.animal_listings.filter(
                location__in=favorite_locations,
                is_active=True
            ).exists()
            
            if has_location_match:
                score += 20
                reasons.append("in your area")
            
            reasons.append("matches your interests")
            reason = f"Seller {', '.join(reasons)}"
            
            self.recommendations.append(
                Recommendation(
                    user=self.user,
                    type=Recommendation.SELLER,
                    object_id=seller.id,
                    score=score,
                    reason=reason
                )
            )
    
    def _generate_butcher_recommendations(self) -> None:
        """
        Generate butcher recommendations (placeholder logic).
        
        This is a placeholder. In the future, this would check:
        - Same city
        - High ratings
        """
        # Placeholder: No butcher logic implemented yet
        # This method exists for future expansion
        pass


def generate_recommendations_for_user(user: User) -> List[Recommendation]:
    """
    Generate and save recommendations for a user.
    
    Args:
        user: User to generate recommendations for
        
    Returns:
        List of created Recommendation instances
    """
    service = RecommendationService(user)
    recommendations = service.generate_all()
    
    # Save recommendations (ignore duplicates)
    saved = []
    for rec in recommendations:
        try:
            rec.save()
            saved.append(rec)
        except Exception:
            # Duplicate or error, skip
            pass
    
    return saved
