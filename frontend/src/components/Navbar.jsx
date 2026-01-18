import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <Link to="/" className="navbar-brand">
                    Kurban<span className="brand-accent">Link</span>
                </Link>

                <div className="navbar-menu">
                    <Link to="/" className="nav-link">Ana Sayfa</Link>
                    <Link to="/coming-soon" className="nav-link">Kurban Ortaklığı</Link>
                    <Link to="/butchers" className="nav-link">Kasap Bul</Link>
                </div>

                <div className="navbar-auth">
                    {user ? (
                        <div className="auth-buttons">
                            <Link to="/profile" className="btn-profile">
                                Profilim
                            </Link>
                            <button onClick={handleLogout} className="btn-secondary">
                                Çıkış
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="btn-primary">
                            Giriş Yap
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
