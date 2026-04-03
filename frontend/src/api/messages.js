import apiClient from './axios';

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
export const sendMessage = async (conversationId, content, parentId = null) => {
    const payload = {
        conversation: conversationId,
        content
    };
    if (parentId) payload.parent_message = parentId;
    
    const response = await apiClient.post('/api/messages/', payload);
    return response.data;
};

/**
 * Create or get existing conversation for a listing
 */
export const createConversation = async (listingId, buyerId = null) => {
    const payload = { listing: listingId };
    if (buyerId) payload.buyer = buyerId;
    
    const response = await apiClient.post('/api/messages/conversations/', payload);
    return response.data;
};

/**
 * Fetch unified inbox (direct + group conversations)
 */
export const fetchInbox = async () => {
    const response = await apiClient.get('/api/messages/inbox/');
    return response.data;
};

/**
 * Fetch group conversation messages
 */
export const fetchGroupMessages = async (groupId) => {
    const response = await apiClient.get(`/api/messages/groups/${groupId}/messages/`);
    return response.data;
};

/**
 * Send message to group conversation
 */
export const sendGroupMessage = async (groupId, content, parentId = null) => {
    const payload = { content };
    if (parentId) payload.parent_message = parentId;

    const response = await apiClient.post(`/api/messages/groups/${groupId}/messages/send/`, payload);
    return response.data;
};

/**
 * Mark all group messages as read
 */
export const markGroupAllRead = async (groupId) => {
    const response = await apiClient.post(`/api/messages/groups/${groupId}/mark_all_read/`);
    return response.data;
};
