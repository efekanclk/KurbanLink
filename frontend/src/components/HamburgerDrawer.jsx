import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

import './HamburgerDrawer.css';
import { User, Calendar, LogOut, ClipboardList, ButcherIcon, PartnershipIcon, MessageCircle } from '../ui/icons';

const HamburgerDrawer = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        onClose();
        navigate('/login');
    };

    const handleLinkClick = () => {
        onClose();
    };

    // Check if user is BUTCHER
    const isButcher = user?.roles?.includes('BUTCHER');

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="drawer-backdrop" onClick={onClose} />

            {/* Drawer Panel */}
            <div className="drawer-panel">
                <div className="drawer-header">
                    <h2>Menü</h2>
                    <button className="drawer-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <nav className="drawer-nav">


                    <Link
                        to="/partnerships"
                        className="drawer-nav-item"
                        onClick={handleLinkClick}
                    >
                        <PartnershipIcon size={18} style={{ marginRight: '0.5rem' }} />
                        Kurban Ortaklığı
                    </Link>

                    <Link
                        to="/butchers"
                        className="drawer-nav-item"
                        onClick={handleLinkClick}
                    >
                        <ButcherIcon size={18} style={{ marginRight: '0.5rem' }} />
                        Kasap Bul
                    </Link>

                    <Link
                        to="/profile"
                        className="drawer-nav-item"
                        onClick={handleLinkClick}
                    >
                        <User size={16} style={{ marginRight: '0.5rem' }} />
                        Profilim
                    </Link>

                    <Link
                        to="/seller/listings"
                        className="drawer-nav-item"
                        onClick={handleLinkClick}
                    >
                        <ClipboardList size={18} style={{ marginRight: '0.5rem' }} />
                        İlanlarım
                    </Link>

                    <Link
                        to="/messages"
                        className="drawer-nav-item"
                        onClick={handleLinkClick}
                    >
                        <MessageCircle size={18} style={{ marginRight: '0.5rem' }} />
                        Mesajlar
                    </Link>

                    {isButcher && (
                        <Link
                            to="/butcher/appointments"
                            className="drawer-nav-item"
                            onClick={handleLinkClick}
                        >
                            <Calendar size={16} style={{ marginRight: '0.5rem' }} />
                            Randevularım
                        </Link>
                    )}

                    <div className="drawer-divider" />

                    <button
                        className="drawer-nav-item drawer-logout-btn"
                        onClick={handleLogout}
                    >
                        <LogOut size={16} style={{ marginRight: '0.5rem' }} />
                        Çıkış Yap
                    </button>
                </nav>
            </div>
        </>
    );
};

export default HamburgerDrawer;
