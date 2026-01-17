/**
 * JWT utility functions for decoding and managing tokens.
 */

/**
 * Decode JWT payload without verification.
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null if invalid
 */
export const decodeJwtPayload = (token) => {
    if (!token) return null;

    try {
        // JWT structure: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = parts[1];

        // Base64 URL decode
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Failed to decode JWT:', error);
        return null;
    }
};

/**
 * Get roles from JWT access token.
 * @param {string} token - JWT access token
 * @returns {string[]} - Array of role codes
 */
export const getRolesFromToken = (token) => {
    const payload = decodeJwtPayload(token);
    return payload?.roles || [];
};

/**
 * Get user ID from JWT access token.
 * @param {string} token - JWT access token
 * @returns {number|null} - User ID
 */
export const getUserIdFromToken = (token) => {
    const payload = decodeJwtPayload(token);
    return payload?.user_id || null;
};
