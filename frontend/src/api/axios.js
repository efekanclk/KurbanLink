import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../utils/token';

// Determine base URL dynamically
const getBaseURL = () => {
    // If we're on localhost, use the local backend
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8000';
    }
    // In production, assume same origin but different path if needed, 
    // or just return empty for relative paths
    return ''; 
};

// Create axios instance with base configuration
const apiClient = axios.create({
    baseURL: getBaseURL(),
});

// Request interceptor to attach access token
apiClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Ignore 401s for auth endpoints (prevents infinite loops and unwanted page reloads)
        if (originalRequest.url?.includes('/api/auth/login') ||
            originalRequest.url?.includes('/api/auth/register') ||
            originalRequest.url?.includes('/api/auth/refresh')) {
            return Promise.reject(error);
        }

        // If 401 and haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = getRefreshToken();
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                // Attempt to refresh token using a relative URL or baseURL
                const refreshURL = getBaseURL() + '/api/auth/refresh/';
                const response = await axios.post(refreshURL, {
                    refresh: refreshToken,
                });

                const { access } = response.data;

                // Update access token
                setTokens(access, refreshToken);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear tokens
                clearTokens();

                // Only redirect to login if this was NOT a public GET request
                const isPublicRead = originalRequest.method?.toLowerCase() === 'get';

                if (!isPublicRead) {
                    // Protected action (POST/PUT/DELETE) - redirect to login
                    window.location.href = '/login';
                }
                // For public GET requests, just reject without redirect
                // This allows anonymous browsing to continue

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
