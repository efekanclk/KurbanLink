import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isInitializing } = useAuth();

    console.log('[ProtectedRoute]', {
        isInitializing,
        isAuthenticated
    });

    // Show loading while initializing
    if (isInitializing) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                gap: '1.25rem',
                color: '#94a3b8'
            }}>
                <div style={{
                    width: '40px', height: '40px',
                    border: '3px solid rgba(31, 122, 77, 0.12)',
                    borderTopColor: '#1f7a4d',
                    borderRadius: '50%',
                    animation: 'spin 0.9s linear infinite'
                }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Yükleniyor...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // After initialization, check authentication
    if (!isAuthenticated) {
        console.log('[ProtectedRoute] Redirecting to /login');
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
