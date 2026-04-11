import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import ConfirmDialog from './ui/ConfirmDialog';

import './HamburgerDrawer.css';
import { User, Calendar, LogOut, ClipboardList, ButcherIcon, PartnershipIcon, MessageCircle } from '../ui/icons';

const HamburgerDrawer = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
    const [pendingPath, setPendingPath] = useState(null);

    const handleLogout = () => {
        logout();
        onClose();
        navigate('/login');
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
        onClose();
        if (pendingPath) {
            navigate(`/login?next=${encodeURIComponent(pendingPath)}`);
        } else {
            navigate('/login');
        }
    };

    const handleLinkClick = (e, path) => {
        if (!user) {
            handleProtectedLink(e, path);
        } else {
            onClose();
        }
    };

    // Check if user is BUTCHER
    const isButcher = user?.roles?.includes('BUTCHER');

    if (!isOpen) return null;

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
                        onClick={(e) => handleLinkClick(e, '/partnerships')}
                    >
                        <PartnershipIcon size={18} style={{ marginRight: '0.5rem' }} />
                        Kurban Ortaklığı
                    </Link>

                    <Link
                        to="/butchers"
                        className="drawer-nav-item"
                        onClick={(e) => handleLinkClick(e, '/butchers')}
                    >
                        <ButcherIcon size={18} style={{ marginRight: '0.5rem' }} />
                        Kasap Bul
                    </Link>

                    <Link
                        to="/profile"
                        className="drawer-nav-item"
                        onClick={(e) => handleLinkClick(e, '/profile')}
                    >
                        <User size={16} style={{ marginRight: '0.5rem' }} />
                        Profilim
                    </Link>

                    <Link
                        to="/seller/listings"
                        className="drawer-nav-item"
                        onClick={(e) => handleLinkClick(e, '/seller/listings')}
                    >
                        <ClipboardList size={18} style={{ marginRight: '0.5rem' }} />
                        İlanlarım
                    </Link>

                    <Link
                        to="/messages"
                        className="drawer-nav-item"
                        onClick={(e) => handleLinkClick(e, '/messages')}
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
