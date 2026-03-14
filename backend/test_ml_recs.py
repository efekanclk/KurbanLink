import os
import sys

from apps.accounts.models import User
from apps.animals.models import AnimalListing
from apps.recommendations.models import ListingInteraction
from apps.recommendations.ml_services import ml_model
from apps.recommendations.services import RecommendationEngine

def main():
    print("--- Testing ML Recommendation Engine ---\n")
    
    # 1. Clear previous interactions for clean test
    ListingInteraction.objects.all().delete()
    print("Cleared existing interactions.\n")
    
    # Get some listings to play with
    listings = list(AnimalListing.objects.filter(is_active=True)[:5])
    if len(listings) < 3:
        print("Not enough listings in DB to test.")
        return
        
    l1, l2, l3 = listings[0], listings[1], listings[2]
    
    # Get or create test users
    u_buyer1, _ = User.objects.get_or_create(email='ml_test1@example.com', defaults={'password': '123'})
    u_buyer2, _ = User.objects.get_or_create(email='ml_test2@example.com', defaults={'password': '123'})
    u_cold, _ = User.objects.get_or_create(email='ml_cold@example.com', defaults={'password': '123'})
    
    # --- COLD START TEST ---
    print("TEST 1: Cold Start (No ML Training)")
    engine = RecommendationEngine()
    cold_results = engine.get_recommendations(user=u_cold, limit=3)
    print(f"Cold Start Recommendations ({len(cold_results)} items):")
    for r in cold_results:
        print(f" - Listing {r['listing'].id} | Score: {r['score']:.2f} | Reasons: {r['reasons']}")
        
    # --- TRAINING DATA INJECTION ---
    print("\nInjecting training data: buyer1 likes L1 & L2. buyer2 likes L1. We expect L2 to be recommended to buyer2 later.")
    # Buyer 1 interacts with L1 and L2
    ListingInteraction.objects.create(user=u_buyer1, listing=l1, interaction_type=ListingInteraction.VIEW)
    ListingInteraction.objects.create(user=u_buyer1, listing=l2, interaction_type=ListingInteraction.FAVORITE)
    
    # Buyer 2 interacts with L1 only
    ListingInteraction.objects.create(user=u_buyer2, listing=l1, interaction_type=ListingInteraction.VIEW)
    
    # --- TRAIN MODEL ---
    print("\nTraining ML Model...")
    success = ml_model.train_model()
    print(f"Training Success: {success}")
    if success:
        print(f"Matrix Columns (Listing IDs): {ml_model.item_similarity_df.columns.tolist()}")
        
    # --- WARM START TEST ---
    print("\nTEST 2: Warm Start (Buyer 2 should get L2 suggested via AI)")
    warm_results = engine.get_recommendations(user=u_buyer2, limit=3)
    
    found_ai = False
    for r in warm_results:
        print(f" - Listing {r['listing'].id} | Score: {r['score']:.2f} | Reasons: {r['reasons']}")
        if 'AI_RECOMMENDED' in r['reasons']:
            found_ai = True
            
    if found_ai:
        print("\nSUCCESS! ML Model successfully recommended an item.")
    else:
        print("\nNote: ML Model didn't strong-recommend anything (maybe scores too low or items filtered).")

if __name__ == '__main__':
    main()
