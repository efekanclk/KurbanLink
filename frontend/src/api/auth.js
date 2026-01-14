import apiClient from './axios';

export const login = async (email, password) => {
    const response = await apiClient.post('/api/auth/login/', {
        email,
        password,
    });
    return response.data;
};

export const refreshToken = async (refreshToken) => {
    const response = await apiClient.post('/api/auth/refresh/', {
        refresh: refreshToken,
    });
    return response.data;
};
