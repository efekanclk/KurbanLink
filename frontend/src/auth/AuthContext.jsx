import { createContext, useState, useContext, useEffect } from 'react';
import { hasTokens, setTokens, clearTokens, getAccessToken } from '../utils/token';
import { loginAPI, registerAPI } from '../api/auth';
import { getRolesFromToken } from '../utils/jwt';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(hasTokens());
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Check authentication status and load roles on mount
    useEffect(() => {
        const authenticated = hasTokens();
        setIsAuthenticated(authenticated);

        if (authenticated) {
            const token = getAccessToken();
            if (token) {
                const userRoles = getRolesFromToken(token);
                setRoles(userRoles);
            }
        }
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const data = await loginAPI(email, password);
            setTokens(data.access, data.refresh);
            setIsAuthenticated(true);

            // Extract and store roles
            const userRoles = getRolesFromToken(data.access);
            setRoles(userRoles);

            return true;
        } catch (err) {
            setError(err.response?.data?.detail || 'Giriş başarısız');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const register = async (payload) => {
        setLoading(true);
        setError(null);
        try {
            const data = await registerAPI(payload);
            setTokens(data.access, data.refresh);
            setIsAuthenticated(true);

            // Store roles from response
            setRoles(data.roles || []);

            return { success: true };
        } catch (err) {
            const errorMessage = err.response?.data || { detail: 'Kayıt başarısız' };
            setError(errorMessage);
            return { success: false, errors: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        clearTokens();
        setIsAuthenticated(false);
        setRoles([]);
    };

    const value = {
        isAuthenticated,
        roles,
        loading,
        error,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
