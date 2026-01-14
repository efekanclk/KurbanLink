import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../utils/token';

// Create axios instance with base configuration
const apiClient = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
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

        // If 401 and haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = getRefreshToken();
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                // Attempt to refresh token
                const response = await axios.post('http://localhost:8000/api/auth/refresh/', {
                    refresh: refreshToken,
                });

                const { access } = response.data;

                // Update access token
                setTokens(access, refreshToken);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear tokens and reject
                clearTokens();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
