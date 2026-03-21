import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:8000',
    headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

/** Fetch all reviews for a butcher (public) */
export const fetchButcherReviews = async (butcherId) => {
    const response = await apiClient.get(`/api/reviews/butchers/${butcherId}/`);
    return response.data;
};

/** Submit a new review for a butcher (auth required) */
export const submitReview = async (butcherId, { rating, comment }) => {
    const response = await apiClient.post(`/api/reviews/butchers/${butcherId}/`, {
        butcher: butcherId,
        rating,
        comment,
    });
    return response.data;
};

/** Fetch current user's own review for a butcher */
export const fetchMyReview = async (butcherId) => {
    const response = await apiClient.get(`/api/reviews/butchers/${butcherId}/me/`);
    return response.data;
};

/** Update current user's review (partial) */
export const updateReview = async (butcherId, { rating, comment }) => {
    const response = await apiClient.patch(`/api/reviews/butchers/${butcherId}/me/`, {
        rating,
        comment,
    });
    return response.data;
};

/** Delete current user's review */
export const deleteReview = async (butcherId) => {
    await apiClient.delete(`/api/reviews/butchers/${butcherId}/me/`);
};
