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
 * Fetch all conversations for current user
 */
export const fetchConversations = async () => {
    const response = await apiClient.get('/api/messages/conversations/');
    return response.data;
};

/**
 * Fetch messages for a specific conversation
 */
export const fetchConversationMessages = async (conversationId) => {
    const response = await apiClient.get(`/api/messages/?conversation=${conversationId}`);
    return response.data;
};

/**
 * Mark all messages in a conversation as read
 */
export const markAllRead = async (conversationId) => {
    const response = await apiClient.post(`/api/messages/conversations/${conversationId}/mark_all_read/`);
    return response.data;
};

/**
 * Send a new message
 */
export const sendMessage = async (conversationId, content) => {
    const response = await apiClient.post('/api/messages/', {
        conversation: conversationId,
        content
    });
    return response.data;
};
