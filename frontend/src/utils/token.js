// Token storage utilities
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const setTokens = (accessToken, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const getAccessToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

export const getRefreshToken = () => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const clearTokens = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const hasTokens = () => {
    return !!getAccessToken() && !!getRefreshToken();
};
