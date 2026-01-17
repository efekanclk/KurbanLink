import apiClient from './axios';

export const loginAPI = async (email, password) => {
    const response = await apiClient.post('/api/auth/login/', { email, password });
    return response.data;
};

export const refreshTokenAPI = async (refreshToken) => {
    const response = await apiClient.post('/api/auth/refresh/', { refresh: refreshToken });
    return response.data;
};

export const registerAPI = async (payload) => {
    const response = await apiClient.post('/api/auth/register/', payload);
    return response.data;
};
