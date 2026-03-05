import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ButcherIcon, PartnershipIcon } from '../ui/icons';
import './BottomNav.css';

const HomeIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const MessageIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const PlusIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const BottomNav = () => {
    const { user } = useAuth();
    const location = useLocation();

    // Hide on auth pages
    const hiddenPaths = ['/login', '/register'];
    if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

    return (
        <nav className="bottom-nav" role="navigation" aria-label="Alt menü">
            <NavLink to="/" end className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <HomeIcon />
                <span>İlanlar</span>
            </NavLink>

            <NavLink to="/messages" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <MessageIcon />
                <span>Mesajlar</span>
            </NavLink>

            <NavLink to="/seller/listings/new" className="bottom-nav-item bottom-nav-cta">
                <div className="bottom-nav-plus">
                    <PlusIcon />
                </div>
                <span>İlan Ver</span>
            </NavLink>

            <NavLink to="/butchers" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <ButcherIcon size={22} />
                <span>Kasap</span>
            </NavLink>

            <NavLink to="/partnerships" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                <PartnershipIcon size={22} />
                <span>Ortaklık</span>
            </NavLink>

            <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                {user ? (
                    user.profile_image_url ? (
                        <img
                            src={user.profile_image_url}
                            alt={user.username}
                            className="bottom-nav-avatar bottom-nav-avatar-img"
                        />
                    ) : (
                        <div className="bottom-nav-avatar">
                            {(user.username?.[0] || 'U').toUpperCase()}
                        </div>
                    )
                ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                )}
                <span>{user ? 'Profil' : 'Giriş'}</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
