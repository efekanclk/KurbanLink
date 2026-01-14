import { createContext, useState, useContext, useEffect } from 'react';
import { hasTokens, setTokens, clearTokens } from '../utils/token';
import { login as loginAPI } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(hasTokens());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Check authentication status on mount
    useEffect(() => {
        setIsAuthenticated(hasTokens());
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const data = await loginAPI(email, password);
            setTokens(data.access, data.refresh);
            setIsAuthenticated(true);
            return true;
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        clearTokens();
        setIsAuthenticated(false);
    };

    const value = {
        isAuthenticated,
        loading,
        error,
        login,
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
