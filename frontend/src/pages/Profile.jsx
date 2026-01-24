import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Profile.css';
import { MapPin, Edit3, Heart, MessageCircle, Calendar, Mail, Phone, ClipboardList } from '../ui/icons';

const Profile = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.substring(0, 2).toUpperCase();
    };

    const formatPhone = (phone, code) => {
        if (!phone) return 'Belirtilmedi';
        return `${code ? code : ''} ${phone}`;
    };

    const getLocation = () => {
        if (user?.city && user?.district) {
            return `${user.city}, ${user.district}`;
        }
        return user?.city || 'Konum belirtilmedi';
    };

    return (
        <div className="page">
            <div className="page__container">
                <div className="profile-header">
                    <button onClick={() => navigate('/')} className="back-btn" style={{ background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0' }}>
                        ← İlanlara Dön
                    </button>
                    <h1>Profilim</h1>
                    <div style={{ width: '100px' }}></div> {/* Spacer for centering if needed, or just auto */}
                </div>

                {/* Main Profile Card */}
                <div className="profile-main-card">
                    <div className="profile-avatar-section">
                        {user?.profile_image_url ? (
                            <img
                                src={user.profile_image_url}
                                alt={user.username}
                                className="profile-avatar"
                            />
                        ) : (
                            <div className="profile-avatar">
                                {getInitials(user?.username)}
                            </div>
                        )}
                    </div>

                    <div className="profile-info-section">
                        <h2 className="profile-name">{user?.username}</h2>
                        <div className="profile-location">
                            <MapPin size={14} style={{ marginRight: '0.25rem' }} />
                            {getLocation()}
                        </div>
                        <div className="profile-contact">
                            <div className="contact-item">
                                <Mail size={14} style={{ marginRight: '0.25rem' }} />
                                {user?.email}
                            </div>
                            <div className="contact-item">
                                <Phone size={14} style={{ marginRight: '0.25rem' }} />
                                {formatPhone(user?.phone_number, user?.country_code)}
                            </div>
                        </div>
                    </div>

                    <div className="profile-actions-section">
                        <button
                            onClick={() => navigate('/profile/edit')}
                            className="edit-profile-btn"
                        >
                            <Edit3 size={16} style={{ marginRight: '0.5rem' }} />
                            Profili Düzenle
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-links-section">
                    <h3 className="section-title">Hızlı İşlemler</h3>
                    <div className="links-grid">
                        <button onClick={() => navigate('/favorites')} className="action-card">
                            <span className="action-icon"><Heart size={20} /></span>
                            <div className="action-text">
                                <h3>Favorilerim</h3>
                                <p>Kaydettiğiniz ilanlar</p>
                            </div>
                        </button>

                        <button onClick={() => navigate('/messages')} className="action-card">
                            <span className="action-icon"><MessageCircle size={20} /></span>
                            <div className="action-text">
                                <h3>Mesajlarım</h3>
                                <p>Sohbet geçmişiniz</p>
                            </div>
                        </button>

                        {/* Seller Actions */}
                        <button onClick={() => navigate('/seller/listings')} className="action-card">
                            <span className="action-icon"><ClipboardList size={20} /></span>
                            <div className="action-text">
                                <h3>İlanlarım</h3>
                                <p>Yayındaki ilanlarınız</p>
                            </div>
                        </button>

                        <button onClick={() => navigate('/seller/listings/new')} className="action-card">
                            <span className="action-icon">➕</span>
                            <div className="action-text">
                                <h3>İlan Oluştur</h3>
                                <p>Yeni satış ilanı verin</p>
                            </div>
                        </button>

                        {/* Butcher Actions */}
                        {user?.roles?.includes('BUTCHER') && (
                            <button onClick={() => navigate('/butcher/appointments')} className="action-card">
                                <span className="action-icon"><Calendar size={20} /></span>
                                <div className="action-text">
                                    <h3>Randevularım</h3>
                                    <p>Kesim randevularınız</p>
                                </div>
                            </button>
                        )}
                    </div>
                </div>

                <div className="logout-section">
                    <button onClick={logout} className="logout-btn-text">
                        Hesaptan Çıkış Yap
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
