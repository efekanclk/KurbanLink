import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import './Header.css';

const Header = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
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

    return (
        <header className="app-header">
            <div className="header-container">
                {/* Brand - Always Left */}
                <Link to="/" className="header-brand">
                    Kurban<span className="brand-accent">Link</span>
                </Link>

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
                        <button type="submit" className="search-btn">
                            🔍
                        </button>
                    </form>
                </div>

                {/* Right Actions */}
                {user ? (
                    <div className="header-actions">
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
                                        👤 Profilim
                                    </Link>
                                    <button
                                        className="user-dropdown-item logout"
                                        onClick={handleLogout}
                                    >
                                        🚪 Çıkış Yap
                                    </button>
                                </div>
                            )}
                        </div>

                        <NotificationDropdown />

                        <button
                            className="header-icon-btn hamburger-btn"
                            title="Menü"
                            onClick={onMenuClick}
                        >
                            ☰
                        </button>
                    </div>
                ) : (
                    <div className="header-actions public-actions">
                        <Link to="/login" className="login-btn">Giriş Yap</Link>
                        <Link to="/register" className="register-btn">Kayıt Ol</Link>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
