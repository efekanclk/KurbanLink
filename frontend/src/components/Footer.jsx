import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Footer.css';

const Footer = () => {
    const { user } = useAuth();
    return (
        <footer className="site-footer">
            <div className="footer-container">
                <div className="footer-brand">
                    <span className="footer-logo">Kurban<span className="footer-logo-accent">Link</span></span>
                    <p className="footer-tagline">Türkiye'nin güvenilir kurbanlık hayvan platformu.</p>
                </div>

                <div className="footer-links">
                    <div className="footer-col">
                        <h4>Platform</h4>
                        <Link to="/">İlanlar</Link>
                        <Link to="/butchers">Kasap Bul</Link>
                        <Link to="/partnerships">Kurban Ortaklığı</Link>
                    </div>
                    <div className="footer-col">
                        <h4>Hesap</h4>
                        {!user && <Link to="/login">Giriş Yap</Link>}
                        <Link to="/seller/listings/new">İlan Ver</Link>
                        <Link to="/profile">Profilim</Link>
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
