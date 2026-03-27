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
            let errorMsg = 'Giriş başarısız. Lütfen tekrar deneyin.';

            if (err.response) {
                const status = err.response.status;
                const data = err.response.data;

                if (status === 401) {
                    // simplejwt returns detail on 401
                    errorMsg = 'E-posta veya şifre hatalı.';
                } else if (status === 400) {
                    // Extract from various DRF error formats
                    if (data?.detail) {
                        errorMsg = data.detail;
                    } else if (data?.non_field_errors?.length) {
                        errorMsg = data.non_field_errors[0];
                    } else if (data?.email?.length) {
                        errorMsg = `E-posta: ${data.email[0]}`;
                    } else if (data?.password?.length) {
                        errorMsg = `Şifre: ${data.password[0]}`;
                    } else {
                        // Fallback: grab first error from any field
                        const firstFieldErrors = Object.values(data || {}).flat();
                        if (firstFieldErrors.length) {
                            errorMsg = firstFieldErrors[0];
                        }
                    }
                } else if (status === 429) {
                    errorMsg = data?.detail || 'Çok fazla deneme yapıldı. Lütfen bir süre bekleyip tekrar deneyin.';
                } else if (status === 500) {
                    errorMsg = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
                } else if (data?.detail) {
                    errorMsg = data.detail;
                }
            } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                errorMsg = 'Bağlantı zaman aşımına uğradı. İnternet bağlantınızı kontrol edin.';
            } else if (!navigator.onLine) {
                errorMsg = 'İnternet bağlantısı bulunamadı.';
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
            await registerAPI(userData);
            // Don't auto-login, let user login manually as requested
            // localStorage.setItem('access_token', data.access);
            // localStorage.setItem('refresh_token', data.refresh);

            // Fetch full user data
            // const userInfo = await fetchMe();
            // setUser(userInfo);

            console.log('[AuthContext] Register success');
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
                isAnonymous: !user && !isInitializing,
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
