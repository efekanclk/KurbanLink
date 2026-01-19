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
            <div className="navbar-container">
                {/* Left: Brand - ALWAYS left-aligned */}
                <div className="navbar-brand">
                    <Link to="/" className="brand-link">
                        Kurban<span className="brand-accent">Link</span>
                    </Link>
                </div>

                {/* Center: Navigation Links */}
                <div className="navbar-nav">
                    <Link to="/" className="nav-link">Ana Sayfa</Link>
                    <Link to="/partnerships" className="nav-link">Kurban Ortaklığı</Link>
                    <Link to="/butchers" className="nav-link">Kasap Bul</Link>
                    {user && (
                        <Link to="/messages" className="nav-link">Mesajlar</Link>
                    )}
                    {user?.roles?.includes('BUTCHER') && (
                        <Link to="/butcher/appointments" className="nav-link">Randevularım</Link>
                    )}
                </div>

                {/* Right: Auth Actions */}
                <div className="navbar-actions">
                    {user ? (
                        <>
                            <Link to="/profile" className="nav-link">
                                Profilim
                            </Link>
                            <button onClick={handleLogout} className="btn-logout">
                                Çıkış
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="btn-login">
                            Giriş Yap
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
