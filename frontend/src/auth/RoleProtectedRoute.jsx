import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const RoleProtectedRoute = ({ children, requiredRole }) => {
    const { user, isAuthenticated, isInitializing } = useAuth();

    console.log('[RoleProtectedRoute]', {
        isInitializing,
        isAuthenticated,
        userRoles: user?.roles,
        requiredRole
    });

    // Show loading while initializing
    if (isInitializing) {
        return (
            <div className="page">
                <div className="page__container">
                    <div className="loading-state">Yükleniyor...</div>
                </div>
            </div>
        );
    }

    // Check authentication first
    if (!isAuthenticated) {
        console.log('[RoleProtectedRoute] Not authenticated, redirecting to /login');
        return <Navigate to="/login" replace />;
    }

    // Then check role
    if (requiredRole && (!user?.roles || !user.roles.includes(requiredRole))) {
        console.log(`[RoleProtectedRoute] Missing ${requiredRole} role, redirecting to /`);
        return (
            <div className="page">
                <div className="page__container">
                    <div className="form-card">
                        <h2>Yetkiniz Yok</h2>
                        <p>Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="submit-btn"
                            style={{ marginTop: '1rem' }}
                        >
                            Ana Sayfaya Dön
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return children;
};

export default RoleProtectedRoute;
