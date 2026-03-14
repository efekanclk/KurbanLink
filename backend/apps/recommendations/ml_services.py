import logging
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from django.db.models import Count
from apps.recommendations.models import ListingInteraction
from apps.animals.models import AnimalListing

logger = logging.getLogger(__name__)

class CollaborativeFilteringModel:
    """
    ML Service for generating recommendations using Item-Based Collaborative Filtering.
    """
    
    def __init__(self):
        self.item_similarity_df = None
        self.is_trained = False

    def train_model(self):
        """
        Loads user interaction data and builds an item-item cosine similarity matrix.
        Should be called periodically (e.g., via a Celery task or cron job).
        """
        logger.info("Starting Collaborative Filtering model training...")
        
        # 1. Fetch relevant interactions (Views, Favorites, Phone clicks, WhatsApp clicks)
        interactions = ListingInteraction.objects.filter(
            listing__is_active=True
        ).values('user_id', 'ip_address', 'listing_id', 'interaction_type')

        if not interactions:
            logger.warning("No interactions found to train the model.")
            self.is_trained = False
            return False

        # Convert to Pandas DataFrame
        df = pd.DataFrame(list(interactions))
        
        # Create a unified 'user_identifier' treating anonymous IPs and logged-in users equally
        df['user_identifier'] = df['user_id'].fillna(df['ip_address'])
        
        # Drop rows where we can't identify the user at all
        df = df.dropna(subset=['user_identifier'])

        if df.empty:
            logger.warning("No valid user identifiers found in interactions.")
            self.is_trained = False
            return False

        # 2. Map interaction types to numerical weights (implicit feedback)
        interaction_weights = {
            ListingInteraction.VIEW: 1,
            ListingInteraction.FAVORITE: 3,
            ListingInteraction.PHONE_CLICK: 5,
            ListingInteraction.WHATSAPP_CLICK: 5
        }
        df['weight'] = df['interaction_type'].map(interaction_weights)

        # 3. Create User-Item Interaction Matrix
        # Group by user and listing, summing weights if a user interacted multiple times
        user_item_grouped = df.groupby(['user_identifier', 'listing_id'])['weight'].sum().reset_index()
        
        # Pivot into matrix (Rows: Users, Columns: Listings, Values: Weights)
        user_item_matrix = user_item_grouped.pivot(
            index='user_identifier', 
            columns='listing_id', 
            values='weight'
        ).fillna(0)

        # 4. Compute Item-Item Cosine Similarity Matrix
        # Transpose matrix so rows are items (Listings)
        item_user_matrix = user_item_matrix.T
        
        # Calculate cosine similarity between items
        # If two items were viewed/interacted by the same users, their similarity score will be high (~1.0)
        similarity_matrix = cosine_similarity(item_user_matrix)
        
        # Convert back to DataFrame with listing IDs as index/columns for easy lookup
        self.item_similarity_df = pd.DataFrame(
            similarity_matrix, 
            index=user_item_matrix.columns, 
            columns=user_item_matrix.columns
        )
        
        self.is_trained = True
        logger.info(f"Model trained successfully. Matrix shape: {self.item_similarity_df.shape}")
        return True

    def get_similar_listings(self, interacted_listing_ids, top_n=20, exclude_ids=None):
        """
        Given a list of listing IDs a user interacted with, returns recommended listing IDs based on ML.
        
        Args:
            interacted_listing_ids (list): IDs of listings the user has viewed/liked.
            top_n (int): Number of recommendations to return.
            exclude_ids (list): IDs to exclude from recommendations.
            
        Returns:
            list: List of dictionaries with 'listing_id' and 'ml_score'
        """
        if not self.is_trained or self.item_similarity_df is None:
            return []
            
        if exclude_ids is None:
            exclude_ids = []

        # Filter out interacted_ids that aren't in our trained matrix
        valid_ids = [lid for lid in interacted_listing_ids if lid in self.item_similarity_df.columns]
        
        if not valid_ids:
            return []

        # Sum the similarity scores across all items the user has interacted with
        # This provides a ranked list of items similar to the ones the user liked
        summed_similarities = self.item_similarity_df[valid_ids].sum(axis=1)

        # Remove items the user has already interacted with or excluded intentionally
        items_to_drop = set(interacted_listing_ids + exclude_ids)
        items_in_matrix = set(summed_similarities.index)
        drop_list = list(items_to_drop.intersection(items_in_matrix))
        
        recommendations = summed_similarities.drop(index=drop_list)
        
        # Sort descending and get top N
        top_recommendations = recommendations.sort_values(ascending=False).head(top_n)
        
        # Format output
        results = [
            {'listing_id': int(idx), 'ml_score': float(score)} 
            for idx, score in top_recommendations.items() 
            if score > 0
        ]
        
        return results

# Singleton instance to be used across the app (ideally, state should be cached in Redis for production)
ml_model = CollaborativeFilteringModel()
