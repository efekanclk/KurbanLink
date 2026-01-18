import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { roleLabel } from '../utils/labels';
import './Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    return (
        <div className="page">
            <div className="page__container">
                <div className="profile-header">
                    <h1>Profilim</h1>
                    <button onClick={() => navigate('/')} className="back-btn">← Geri</button>
                </div>

                <div className="profile-card">
                    <div className="profile-section">
                        <h2>Bilgilerim</h2>
                        <div className="profile-info">
                            <div className="info-item">
                                <strong>E-posta:</strong>
                                <span>{user?.email || 'Bilinmiyor'}</span>
                            </div>
                            <div className="info-item">
                                <strong>Roller:</strong>
                                <span>{user?.roles?.map(roleLabel).join(', ') || 'Yok'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-section">
                        <h2>Hızlı Bağlantılar</h2>
                        <div className="quick-links">
                            {/* Always visible */}
                            <button onClick={() => navigate('/favorites')} className="link-btn">
                                ❤️ Favorilerim
                            </button>
                            <button onClick={() => navigate('/messages')} className="link-btn">
                                💬 Mesajlarım
                            </button>
                            <button onClick={() => navigate('/notifications')} className="link-btn">
                                🔔 Bildirimler
                            </button>

                            {/* Seller links */}
                            {user?.roles?.includes('SELLER') && (
                                <>
                                    <button onClick={() => navigate('/seller/listings')} className="link-btn">
                                        📋 İlanlarım
                                    </button>
                                    <button onClick={() => navigate('/seller/listings/new')} className="link-btn">
                                        ➕ Yeni İlan Oluştur
                                    </button>
                                </>
                            )}

                            {/* Butcher links */}
                            {user?.roles?.includes('BUTCHER') && (
                                <>
                                    <button onClick={() => navigate('/butcher/appointments')} className="link-btn">
                                        📅 Randevularım
                                    </button>
                                    <button onClick={() => navigate('/butcher/profile')} className="link-btn">
                                        👤 Kasap Profilim
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="profile-section">
                        <button onClick={logout} className="logout-btn">
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
