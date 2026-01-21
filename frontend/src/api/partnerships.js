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
 * Fetch all partnerships
 */
export const fetchPartnerships = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.city) params.append('city', filters.city);
    if (filters.show_closed) params.append('show_closed', 'true');

    const response = await apiClient.get(`/api/partnerships/?${params}`);
    return response.data;
};

/**
 * Fetch single partnership detail
 */
export const fetchPartnershipDetail = async (id) => {
    const response = await apiClient.get(`/api/partnerships/${id}/`);
    return response.data;
};

/**
 * Create partnership
 */
export const createPartnership = async (data) => {
    const response = await apiClient.post('/api/partnerships/', data);
    return response.data;
};

/**
 * Request to join partnership
 */
export const requestJoin = async (partnershipId) => {
    const response = await apiClient.post(`/api/partnerships/${partnershipId}/request_join/`);
    return response.data;
};

/**
 * Get pending join requests (creator only)
 */
export const fetchJoinRequests = async (partnershipId) => {
    const response = await apiClient.get(`/api/partnerships/${partnershipId}/requests/`);
    return response.data;
};

/**
 * Approve join request (creator only)
 */
export const approveRequest = async (partnershipId, requestId) => {
    const response = await apiClient.post(
        `/api/partnerships/${partnershipId}/requests/${requestId}/approve/`
    );
    return response.data;
};

/**
 * Reject join request (creator only)
 */
export const rejectRequest = async (partnershipId, requestId) => {
    const response = await apiClient.post(
        `/api/partnerships/${partnershipId}/requests/${requestId}/reject/`
    );
    return response.data;
};

/**
 * Leave partnership
 */
export const leavePartnership = async (partnershipId) => {
    const response = await apiClient.post(`/api/partnerships/${partnershipId}/leave/`);
    return response.data;
};

/**
 * Close partnership (creator only)
 */
export const closePartnership = async (partnershipId) => {
    const response = await apiClient.post(`/api/partnerships/${partnershipId}/close/`);
    return response.data;
};

/**
 * Get partnership members (members only)
 */
export const fetchMembers = async (partnershipId) => {
    const response = await apiClient.get(`/api/partnerships/${partnershipId}/members/`);
    return response.data;
};
