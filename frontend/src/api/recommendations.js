import api from './axios';

export const recommendationService = {
    // Get recommended listings
    getRecommendedListings: async (params = {}) => {
        // params: city, district, limit, exclude_ids
        const response = await api.get('/api/recommendations/listings/', { params });
        return response.data;
    },

    // Log user interaction
    logInteraction: async (listingId, interactionType) => {
        // interactionType: VIEW, PHONE_CLICK, WHATSAPP_CLICK, FAVORITE
        const response = await api.post('/api/recommendations/interactions/', {
            listing: listingId,
            interaction_type: interactionType
        });
        return response.data;
    }
};
