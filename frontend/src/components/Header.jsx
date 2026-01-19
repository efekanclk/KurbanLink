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

                {/* Right Actions */}
                {user && (
                    <div className="header-actions">
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
                )}
            </div>
        </header>
    );
};

export default Header;
