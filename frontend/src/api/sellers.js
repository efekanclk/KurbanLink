import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


/**
 * Fetch listings owned by current user (seller)
 */
export const fetchMyListings = async (userId, options = {}) => {
    // Backend supports ?mine=true filter
    try {
        const params = { seller: userId };
        if (options.mine) {
            params.mine = 'true';
        }
        if (options.deleted) {
            params.deleted = 'true';
        }

        const response = await apiClient.get('/api/animals/', { params });
        return response.data;
    } catch (error) {
        // Fallback or error handling
        throw error;
    }
};

/**
 * Create a new animal listing
 */
export const createListing = async (data) => {
    const response = await apiClient.post('/api/animals/', data);
    return response.data;
};

/**
 * Update an existing listing
 */
export const updateListing = async (id, data) => {
    const response = await apiClient.patch(`/api/animals/${id}/`, data);
    return response.data;
};

/**
 * Delete (or deactivate) a listing
 * Standard delete is Soft Delete (Trash)
 */
export const deleteListing = async (id) => {
    const response = await apiClient.delete(`/api/animals/${id}/`);
    return response.data;
};

/**
 * Permanently delete a listing (Hard Delete)
 */
export const permanentlyDeleteListing = async (id) => {
    const response = await apiClient.delete(`/api/animals/${id}/`, {
        params: { force: 'true' }
    });
    return response.data;
};

/**
 * Upload images for a listing
 * Uploads multiple images sequentially
 */
export const uploadListingImages = async (listingId, images) => {
    const uploadResults = [];

    for (const imageItem of images) {
        const formData = new FormData();
        // Handle both raw File objects and objects with { file, is_primary }
        const file = imageItem.file || imageItem;
        const isPrimary = imageItem.is_primary || false;

        formData.append('image', file);
        formData.append('listing', listingId);
        formData.append('is_primary', isPrimary.toString());

        try {
            const response = await apiClient.post(
                `/api/animals/${listingId}/images/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            uploadResults.push({ success: true, data: response.data, file: file.name });
        } catch (error) {
            uploadResults.push({
                success: false,
                error: error.response?.data?.detail || 'Upload failed',
                file: file.name
            });
        }
    }

    return uploadResults;
};

/**
 * Fetch listing details
 */
export const fetchListingDetails = async (id) => {
    const response = await apiClient.get(`/api/animals/${id}/`);
    return response.data;
};
