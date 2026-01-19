import { createContext, useContext, useState, useEffect } from 'react';
import { loginAPI, registerAPI, fetchMe } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);

    // Initialize auth state from backend on mount
    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = localStorage.getItem('access_token');

                console.log('[AuthContext] Initializing:', {
                    hasToken: !!token
                });

                if (token) {
                    try {
                        // Fetch user identity from backend
                        const userData = await fetchMe();

                        console.log('[AuthContext] User data fetched:', userData);
                        setUser(userData);
                    } catch (err) {
                        console.error('[AuthContext] fetchMe failed:', err);
                        // Token invalid or expired - clear it
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        setUser(null);
                    }
                } else {
                    console.log('[AuthContext] No token found');
                    setUser(null);
                }
            } catch (err) {
                console.error('[AuthContext] Init error:', err);
                setUser(null);
            } finally {
                setIsInitializing(false);
            }
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);

        try {
            const data = await loginAPI(email, password);
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);

            // Fetch full user data
            const userData = await fetchMe();
            setUser(userData);

            console.log('[AuthContext] Login success:', userData);
            return true;
        } catch (err) {
            let errorMsg = 'Giriş başarısız';

            if (err.response) {
                if (err.response.status === 401) {
                    errorMsg = 'E-posta veya şifre hatalı.';
                } else if (err.response.data?.detail) {
                    errorMsg = err.response.data.detail;
                }
            }

            setError(errorMsg);
            console.error('[AuthContext] Login failed:', err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        setError(null);

        try {
            const data = await registerAPI(userData);
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);

            // Fetch full user data
            const userInfo = await fetchMe();
            setUser(userInfo);

            console.log('[AuthContext] Register success:', userInfo);
            return { success: true };
        } catch (err) {
            const errors = err.response?.data || {};
            console.error('[AuthContext] Register failed:', err);
            return { success: false, errors };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        console.log('[AuthContext] Logout');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                loading,
                error,
                isInitializing,
                login,
                register,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
