import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Menu, X } from '../ui/icons';
import ConfirmDialog from './ui/ConfirmDialog';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
    const [pendingPath, setPendingPath] = useState(null);

    const handleLogout = () => {
        logout();
        setIsDrawerOpen(false);
        navigate('/');
    };

    const handleProtectedLink = (e, path) => {
        if (!user) {
            e.preventDefault();
            setPendingPath(path);
            setIsAuthDialogOpen(true);
        }
    };

    const handleAuthConfirm = () => {
        setIsAuthDialogOpen(false);
        if (pendingPath) {
            navigate(`/login?next=${encodeURIComponent(pendingPath)}`);
        } else {
            navigate('/login');
        }
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
    };

    // ESC key handler and body scroll lock
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isDrawerOpen) {
                closeDrawer();
            }
        };

        if (isDrawerOpen) {
            // Lock body scroll
            document.body.style.overflow = 'hidden';
            // Add ESC listener
            document.addEventListener('keydown', handleEscape);
        } else {
            // Unlock body scroll
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isDrawerOpen]);

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <ConfirmDialog
                isOpen={isAuthDialogOpen}
                title="Giriş Gerekli"
                message="Bu işlemi yapmak için giriş yapmalısınız!"
                confirmText="Giriş Yap"
                cancelText="Kapat"
                onConfirm={handleAuthConfirm}
                onCancel={() => setIsAuthDialogOpen(false)}
                type="primary"
            />
            <nav className="navbar">
                <div className="navbar-container">
                    {/* Left: Brand */}
                    <div className="navbar-brand">
                        <Link to="/" className="brand-link" onClick={closeDrawer}>
                            Kurban<span className="brand-accent">Link</span>
                        </Link>
                    </div>

                    {/* Center: Desktop Navigation Links */}
                    <div className="navbar-nav">
                        <Link to="/" className="nav-link">Ana Sayfa</Link>
                        <Link 
                            to="/partnerships" 
                            className="nav-link"
                            onClick={(e) => handleProtectedLink(e, '/partnerships')}
                        >
                            Kurban Ortaklığı
                        </Link>
                        <Link 
                            to="/butchers" 
                            className="nav-link"
                            onClick={(e) => handleProtectedLink(e, '/butchers')}
                        >
                            Kasap Bul
                        </Link>
                        {user && (
                            <Link to="/messages" className="nav-link">Mesajlar</Link>
                        )}
                        {user?.roles?.includes('BUTCHER') && (
                            <Link to="/butcher/appointments" className="nav-link">Randevularım</Link>
                        )}
                    </div>

                    {/* Right: Auth Actions (Desktop) */}
                    <div className="navbar-actions">
                        {user ? (
                            <>
                                <Link to="/profile" className="nav-link">
                                    Profilim
                                </Link>
                                <button onClick={handleLogout} className="btn-logout">
                                    Çıkış
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn-login">
                                    Giriş Yap
                                </Link>
                                <Link to="/register" className="btn-register">
                                    Kayıt Ol
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile: Hamburger Icon */}
                    <button
                        className="navbar-hamburger"
                        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                        aria-label="Menü"
                    >
                        {isDrawerOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Drawer Overlay */}
            {isDrawerOpen && (
                <div className="drawer-overlay" onClick={closeDrawer} />
            )}

            {/* Mobile Drawer */}
            <div className={`mobile-drawer ${isDrawerOpen ? 'open' : ''}`}>
                <div className="drawer-content">
                    {/* User Info (if logged in) */}
                    {user && (
                        <div className="drawer-user-section">
                            <div className="drawer-user-info">
                                <div className="drawer-user-avatar">
                                    {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="drawer-user-details">
                                    <div className="drawer-user-name">
                                        {user.username || user.email?.split('@')[0]}
                                    </div>
                                    <div className="drawer-user-email">{user.email}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Links */}
                    <div className="drawer-nav">
                        <Link
                            to="/"
                            className={`drawer-link ${isActive('/') ? 'active' : ''}`}
                            onClick={closeDrawer}
                        >
                            Ana Sayfa
                        </Link>
                        <Link
                            to="/partnerships"
                            className={`drawer-link ${isActive('/partnerships') ? 'active' : ''}`}
                            onClick={(e) => {
                                handleProtectedLink(e, '/partnerships');
                                if (user) closeDrawer();
                            }}
                        >
                            Kurban Ortaklığı
                        </Link>
                        <Link
                            to="/butchers"
                            className={`drawer-link ${isActive('/butchers') ? 'active' : ''}`}
                            onClick={(e) => {
                                handleProtectedLink(e, '/butchers');
                                if (user) closeDrawer();
                            }}
                        >
                            Kasap Bul
                        </Link>

                        {user && (
                            <>
                                <div className="drawer-divider" />
                                <Link
                                    to="/messages"
                                    className={`drawer-link ${isActive('/messages') ? 'active' : ''}`}
                                    onClick={closeDrawer}
                                >
                                    Mesajlar
                                </Link>
                                <Link
                                    to="/profile"
                                    className={`drawer-link ${isActive('/profile') ? 'active' : ''}`}
                                    onClick={closeDrawer}
                                >
                                    Profilim
                                </Link>
                                {user?.roles?.includes('BUTCHER') && (
                                    <Link
                                        to="/butcher/appointments"
                                        className={`drawer-link ${isActive('/butcher/appointments') ? 'active' : ''}`}
                                        onClick={closeDrawer}
                                    >
                                        Randevularım
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    {/* Auth Actions */}
                    <div className="drawer-actions">
                        {user ? (
                            <button onClick={handleLogout} className="drawer-btn drawer-btn-logout">
                                Çıkış Yap
                            </button>
                        ) : (
                            <>
                                <Link to="/login" className="drawer-btn drawer-btn-login" onClick={closeDrawer}>
                                    Giriş Yap
                                </Link>
                                <Link to="/register" className="drawer-btn drawer-btn-register" onClick={closeDrawer}>
                                    Kayıt Ol
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;
