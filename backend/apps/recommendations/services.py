import logging
from datetime import timedelta
from django.db.models import Q, F, Count, Avg
from django.utils import timezone
from apps.animals.models import AnimalListing
from apps.accounts.models import User
from .models import ListingInteraction

logger = logging.getLogger(__name__)

class RecommendationEngine:
    """
    Rule-based recommendation engine for Animal Listings.
    Deterministic and explainable ranking for MVP.
    """
    
    def __init__(self):
        self.weights = {
            'location_city': 0.30,
            'location_district': 0.15,
            'price_match': 0.20,
            'popularity': 0.10,
            'recency': 0.05,
            'diversity_penalty': 0.10
        }

    def get_recommendations(self, user=None, city=None, district=None, limit=20, exclude_ids=None):
        """
        Main entry point for retrieving recommended listings.
        """
        if exclude_ids is None:
            exclude_ids = []
            
        # 1. Determine Context (Location)
        target_city = city
        target_district = district
        
        if user and user.is_authenticated:
            # If logged in, prefer profile location if not overridden
            if not target_city:
                target_city = user.city
            if not target_district:
                target_district = user.district
        
        # 2. Candidate Generation
        candidates = self._generate_candidates(user, target_city, exclude_ids)
        
        # 3. Scoring
        scored_listings = []
        for listing in candidates:
            score, reasons = self._score_listing(listing, user, target_city, target_district)
            scored_listings.append({
                'listing': listing,
                'score': score,
                'reasons': reasons
            })
            
        # 4. Sorting & Re-ranking (Diversity)
        # Sort by score desc
        scored_listings.sort(key=lambda x: x['score'], reverse=True)
        
        # Apply diversity penalty (simple version: reduce score if seller appeared recently)
        final_list = self._apply_diversity(scored_listings)
        
        return final_list[:limit]

    def _generate_candidates(self, user, target_city, exclude_ids):
        """
        Fetch active listings to be scored.
        """
        # Base filter: Active listings only
        queryset = AnimalListing.objects.filter(is_active=True)
        
        # Exclude already seen/specific IDs
        if exclude_ids:
            queryset = queryset.exclude(id__in=exclude_ids)
            
        # Exclude own listings
        if user and user.is_authenticated:
            queryset = queryset.exclude(seller=user)
            
        # For MVP optimization: 
        # If we have a target city, fetch all from that city + some popular/recent from others
        # Use simple union or just fetch top 100 recent/popular to score
        if target_city:
            # Priority: Same city OR Recent
            queryset = queryset.filter(
                Q(city__iexact=target_city) | 
                Q(created_at__gte=timezone.now() - timedelta(days=30))
            )
        else:
            # No location context: just recent listings
            queryset = queryset.filter(created_at__gte=timezone.now() - timedelta(days=60))
            
        # Limit candidate pool size for performance (score max 200 items)
        return queryset.select_related('seller').order_by('-created_at')[:200]

    def _score_listing(self, listing, user, target_city, target_district):
        """
        Calculate score for a single listing.
        Returns (score, reasons_list)
        """
        score = 0.0
        reasons = []
        
        # 1. Location Match
        if target_city and listing.city and listing.city.lower() == target_city.lower():
            score += self.weights['location_city']
            reasons.append('SAME_CITY')
            
            if target_district and listing.district and listing.district.lower() == target_district.lower():
                score += self.weights['location_district']
                reasons.append('SAME_DISTRICT')

        # 2. Recency (New Listing)
        # Is created in last 7 days?
        if listing.created_at >= timezone.now() - timedelta(days=7):
            score += self.weights['recency']
            reasons.append('NEW_LISTING')
            
        # 3. Popularity (View Count)
        # Simple normalization: cap at 100 views -> max boost
        views = listing.view_count
        popularity_boost = min(views / 100.0, 1.0) * self.weights['popularity']
        if popularity_boost > 0.05: # Threshold to mention
            score += popularity_boost
            reasons.append('POPULAR')
        else:
            score += popularity_boost

        # 4. Price Match (Placeholder for MVP)
        # If we had user history, we would compare price.
        # For now, neutral.
        
        return score, reasons

    def _apply_diversity(self, scored_listings):
        """
        Penalize consecutive listings from same seller.
        """
        seller_counts = {}
        adjusted_list = []
        
        for item in scored_listings:
            seller_id = item['listing'].seller_id
            count = seller_counts.get(seller_id, 0)
            
            if count > 0:
                # Penalty for subsequent listings from same seller
                penalty = self.weights['diversity_penalty'] * count
                item['score'] -= penalty
                # Clamp at 0
                item['score'] = max(0.0, item['score'])
            
            seller_counts[seller_id] = count + 1
            adjusted_list.append(item)
            
        # Re-sort after penalties
        adjusted_list.sort(key=lambda x: x['score'], reverse=True)
        return adjusted_list

    def log_interaction(self, user, listing_id, interaction_type, ip_address=None):
        """
        Log user interaction.
        """
        try:
            listing = AnimalListing.objects.get(id=listing_id)
            ListingInteraction.objects.create(
                user=user if user and user.is_authenticated else None,
                listing=listing,
                interaction_type=interaction_type,
                ip_address=ip_address
            )
            
            # Update view count directly on listing for simple tracking
            if interaction_type == ListingInteraction.VIEW:
                listing.view_count = F('view_count') + 1
                listing.save(update_fields=['view_count'])
                
        except AnimalListing.DoesNotExist:
            pass
