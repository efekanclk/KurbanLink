import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Header.css';

const Header = ({ onMenuClick }) => {
    const { user } = useAuth();

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
                        <button className="header-icon-btn" title="Bildirimler">
                            🔔
                        </button>
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
