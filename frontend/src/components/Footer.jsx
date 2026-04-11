import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import ConfirmDialog from './ui/ConfirmDialog';
import './Footer.css';

const Footer = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
    const [pendingPath, setPendingPath] = useState(null);

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
            <footer className="site-footer">
            <div className="footer-container">
                <div className="footer-brand">
                    <span className="footer-logo">Kurban<span className="footer-logo-accent">Link</span></span>
                    <p className="footer-tagline">Türkiye'nin güvenilir kurbanlık hayvan platformu.</p>
                </div>

                <div className="footer-links">
                    <div className="footer-col">
                        <h4>Platform</h4>
                        <Link to="/" onClick={(e) => { /* public */ }}>İlanlar</Link>
                        <Link to="/butchers" onClick={(e) => handleProtectedLink(e, '/butchers')}>Kasap Bul</Link>
                        <Link to="/partnerships" onClick={(e) => handleProtectedLink(e, '/partnerships')}>Kurban Ortaklığı</Link>
                    </div>
                    <div className="footer-col">
                        <h4>Hesap</h4>
                        {!user && <Link to="/login">Giriş Yap</Link>}
                        <Link to="/seller/listings/new" onClick={(e) => handleProtectedLink(e, '/seller/listings/new')}>İlan Ver</Link>
                        <Link to="/profile" onClick={(e) => handleProtectedLink(e, '/profile')}>Profilim</Link>
                    </div>
                    <div className="footer-col">
                        <h4>Bize Ulaşın</h4>
                        <a href="mailto:destek@kurbanlink.com">destek@kurbanlink.com</a>
                        <Link to="/kvkk">KVKK Aydınlatma Metni</Link>
                        <Link to="/gizlilik">Gizlilik Politikası</Link>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <span>© {new Date().getFullYear()} KurbanLink. Tüm hakları saklıdır.</span>
            </div>
        </footer>
    );
};

export default Footer;
