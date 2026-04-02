import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Search, User, LogOut, Menu, ButcherIcon } from '../ui/icons';
import NotificationDropdown from './NotificationDropdown';
import ConfirmDialog from './ui/ConfirmDialog';
import './Header.css';

const Header = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
    const [pendingPath, setPendingPath] = useState(null);
    const profileRef = useRef(null);

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.substring(0, 2).toUpperCase();
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        setIsProfileOpen(false);
        navigate('/login');
    };

    const handleProtectedClick = (e, path) => {
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

    return (
        <header className="app-header">
            <div className="header-container">
                                <button
                    className="header-icon-btn hamburger-btn"
                    title="Menü"
                    onClick={onMenuClick}
                >
                    <Menu size={24} />
                </button>

                {/* Brand - Always Left */}
                <Link to="/" className="header-brand">
                    Kurban<span className="brand-accent">Link</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="header-nav">
                    <Link 
                        to="/butchers" 
                        className="header-nav-link"
                        onClick={(e) => handleProtectedClick(e, '/butchers')}
                    >
                        Kasap Bul
                    </Link>
                    <Link 
                        to="/partnerships" 
                        className="header-nav-link"
                        onClick={(e) => handleProtectedClick(e, '/partnerships')}
                    >
                        Kurban Ortaklığı
                    </Link>
                </nav>

                {/* Search Bar - Center/Right */}
                <div className="header-search">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const term = e.target.search.value.trim();
                        if (term) {
                            navigate(`/?search=${encodeURIComponent(term)}`);
                        } else {
                            navigate('/');
                        }
                    }}>
                        <input
                            type="text"
                            name="search"
                            placeholder="Kelime, ilan no veya şehir ile ara"
                            className="search-input"
                            autoComplete="off"
                        />
                        <button type="submit" className="search-btn" aria-label="Ara">
                            <Search size={18} />
                        </button>
                    </form>
                </div>

                <div className="header-actions">

                    {user ? (
                        <>
                            {user?.roles?.includes('BUTCHER') && (
                                <Link to="/butcher/appointments" className="kasap-paneli-header-btn">
                                    <ButcherIcon size={18} />
                                    Kasap Paneli
                                </Link>
                            )}
                            <Link to="/seller/listings/new" className="create-listing-header-btn">
                                + İlan Ver
                            </Link>

                            {/* User Profile Dropdown */}
                            <div className="user-menu-container" ref={profileRef}>
                                <button
                                    className="header-user-btn"
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                >
                                    {user.profile_image_url ? (
                                        <img
                                            src={user.profile_image_url}
                                            alt={user.username}
                                            className="header-avatar"
                                        />
                                    ) : (
                                        <div className="header-avatar">
                                            {getInitials(user.username)}
                                        </div>
                                    )}
                                    <span className="header-username">{user.username}</span>
                                </button>

                                {isProfileOpen && (
                                    <div className="user-dropdown-menu">
                                        <Link
                                            to="/profile"
                                            className="user-dropdown-item"
                                            onClick={() => setIsProfileOpen(false)}
                                        >
                                            <User size={16} style={{ marginRight: '0.5rem' }} />
                                            Profilim
                                        </Link>
                                        <button
                                            className="user-dropdown-item logout"
                                            onClick={handleLogout}
                                        >
                                            <LogOut size={16} style={{ marginRight: '0.5rem' }} />
                                            Çıkış Yap
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="public-actions">
                            <Link to="/login" className="login-btn">Giriş Yap</Link>
                            <Link to="/register" className="register-btn">Kayıt Ol</Link>
                        </div>
                    )}

                    <NotificationDropdown />
                </div>

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
            </div>
        </header>
    );
};

export default Header;
