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
 * Fetch all notifications for current user
 */
export const fetchNotifications = async () => {
    const response = await apiClient.get('/api/notifications/');
    return response.data;
};

/**
 * Mark a notification as read
 */
export const markNotificationRead = async (notificationId) => {
    const response = await apiClient.post(`/api/notifications/${notificationId}/mark_as_read/`);
    return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllRead = async () => {
    const response = await apiClient.post('/api/notifications/mark_all_read/');
    return response.data;
};
