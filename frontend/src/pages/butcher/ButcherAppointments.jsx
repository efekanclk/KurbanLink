import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    fetchButcherAppointments,
    approveAppointment,
    rejectAppointment,
    fetchMyButcherProfile,
    createButcherProfile,
    updateButcherProfile
} from '../../api/butchers';
import './ButcherAppointments.css';
import { Calendar, Clock, ArrowLeft, Edit3, MessageCircle } from '../../ui/icons';
import { createConversation } from '../../api/messages';
import { cities, getDistrictsForCity } from '../../data/locations';

const ButcherPanel = () => {
    const navigate = useNavigate();

    // Panel State
    const [profileLoading, setProfileLoading] = useState(true);
    const [hasProfile, setHasProfile] = useState(false);
    const [currentProfile, setCurrentProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Appointments State
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState({});

    // Profile Form State
    const [profileData, setProfileData] = useState({
        city: '',
        district: '',
        price_range: '',
        services: '', // Comma separated
        first_name: '',
        last_name: ''
    });
    const [createError, setCreateError] = useState(null);
    const [createLoading, setCreateLoading] = useState(false);

    useEffect(() => {
        checkProfile();
    }, []);

    const checkProfile = async () => {
        setProfileLoading(true);
        try {
            const profile = await fetchMyButcherProfile();
            if (profile && profile.id) {
                setHasProfile(true);
                setCurrentProfile(profile);
                loadAppointments();
            } else {
                setHasProfile(false);
            }
        } catch (err) {
            console.error('Profile check failed:', err);
            setHasProfile(false);
        } finally {
            setProfileLoading(false);
        }
    };

    const loadAppointments = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await fetchButcherAppointments();
            setAppointments(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            console.error('Failed to load appointments:', err);
            setError('Randevular yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProfile = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        setCreateError(null);

        try {
            const payload = {
                ...profileData,
                services: profileData.services.split(',').map(s => s.trim()).filter(Boolean)
            };

            await createButcherProfile(payload);
            setHasProfile(true);
            loadAppointments();
        } catch (err) {
            console.error('Create profile failed:', err);
            const msg = err.response?.data?.error?.message ||
                err.response?.data?.detail ||
                'Profil oluşturulamadı. Lütfen tekrar deneyin.';
            setCreateError(msg);
        } finally {
            setCreateLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        setCreateError(null);

        try {
            const payload = {
                ...profileData,
                services: typeof profileData.services === 'string'
                    ? profileData.services.split(',').map(s => s.trim()).filter(Boolean)
                    : profileData.services
            };

            await updateButcherProfile(currentProfile.id, payload);
            setIsEditing(false);
            await checkProfile();
        } catch (err) {
            console.error('Update profile failed:', err);
            const msg = err.response?.data?.detail || 'Profil güncellenemedi.';
            setCreateError(msg);
        } finally {
            setCreateLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'city') {
            setProfileData(prev => ({
                ...prev,
                [name]: value,
                district: ''
            }));
        } else {
            setProfileData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Helper to get districts based on selected city
    const districts = profileData.city ? getDistrictsForCity('TR', profileData.city) : [];

    const handleApprove = async (id) => {
        setActionLoading(prev => ({ ...prev, [id]: 'approve' }));
        try {
            await approveAppointment(id);
            await loadAppointments();
        } catch (err) {
            console.error('Approve failed:', err);
            alert('Onaylama başarısız: ' + (err.response?.data?.detail || 'Bilinmeyen hata'));
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: null }));
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Bu randevuyu reddetmek istediğinize emin misiniz?')) {
            return;
        }

        setActionLoading(prev => ({ ...prev, [id]: 'reject' }));
        try {
            await rejectAppointment(id);
            await loadAppointments();
        } catch (err) {
            console.error('Reject failed:', err);
            alert('Reddetme başarısız: ' + (err.response?.data?.detail || 'Bilinmeyen hata'));
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: null }));
        }
    };

    const handleMessageCustomer = async (apt) => {
        setActionLoading(prev => ({ ...prev, [apt.id]: 'message' }));
        try {
            // Initiate/get conversation
            // If apt.listing is null, the backend now supports general conversations
            const conv = await createConversation(apt.listing || null, apt.user);
            navigate(`/messages?conversation=${conv.id}`);
        } catch (err) {
            console.error('Failed to start conversation:', err);
            alert('Mesajlaşma başlatılamadı: ' + (err.response?.data?.detail || 'Bilinmeyen hata'));
        } finally {
            setActionLoading(prev => ({ ...prev, [apt.id]: null }));
        }
    };

    const startEditing = () => {
        if (!currentProfile) return;
        setProfileData({
            city: currentProfile.city || '',
            district: currentProfile.district || '',
            price_range: currentProfile.price_range || '',
            services: Array.isArray(currentProfile.services) ? currentProfile.services.join(', ') : '',
            first_name: currentProfile.first_name || '',
            last_name: currentProfile.last_name || ''
        });
        setIsEditing(true);
        setCreateError(null);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (timeStr) => {
        return timeStr.substring(0, 5);
    };

    // Group appointments by status
    const pending = appointments.filter(a => a.status === 'PENDING');
    const approved = appointments.filter(a => a.status === 'APPROVED');
    const rejected = appointments.filter(a => a.status === 'REJECTED');
    const cancelled = appointments.filter(a => a.status === 'CANCELLED');

    // Group approved by date
    const approvedByDate = approved.reduce((acc, apt) => {
        if (!acc[apt.date]) acc[apt.date] = [];
        acc[apt.date].push(apt);
        return acc;
    }, {});

    const renderAppointmentCard = (apt, showActions = false) => (
        <div key={apt.id} className="appointment-card">
            <div className="card-header">
                <div className="date-time">
                    <span className="date">
                        <Calendar size={14} style={{ marginRight: '0.25rem' }} />
                        {formatDate(apt.date)}
                    </span>
                    <span className="time">
                        <Clock size={14} style={{ marginRight: '0.25rem' }} />
                        {formatTime(apt.time)}
                    </span>
                </div>
                <span className={`status-badge status-${apt.status.toLowerCase()}`}>
                    {apt.status === 'PENDING' ? 'Beklemede' :
                        apt.status === 'APPROVED' ? 'Onaylandı' :
                            apt.status === 'REJECTED' ? 'Reddedildi' :
                                'İptal Edildi'}
                </span>
            </div>

            <div className="card-body">
                <div className="info-row">
                    <span className="label">Müşteri:</span>
                    <span className="value">
                        {apt.user_full_name || apt.user_name || 'Bilinmiyor'}
                    </span>
                </div>
                <div className="info-row">
                    <span className="label">E-posta:</span>
                    <span className="value">{apt.user_email}</span>
                </div>
                {apt.note && (
                    <div className="info-row">
                        <span className="label">Not:</span>
                        <span className="value">{apt.note}</span>
                    </div>
                )}
            </div>

            {showActions ? (
                <div className="card-actions">
                    <button
                        onClick={() => handleApprove(apt.id)}
                        className="btn-approve"
                        disabled={actionLoading[apt.id]}
                    >
                        {actionLoading[apt.id] === 'approve' ? 'Onaylanıyor...' : 'Onayla'}
                    </button>
                    <button
                        onClick={() => handleReject(apt.id)}
                        className="btn-reject"
                        disabled={actionLoading[apt.id]}
                    >
                        {actionLoading[apt.id] === 'reject' ? 'Reddediliyor...' : 'Reddet'}
                    </button>
                </div>
            ) : apt.status === 'APPROVED' && (
                <div className="card-actions">
                    <button
                        onClick={() => handleMessageCustomer(apt)}
                        className="btn-message"
                        disabled={actionLoading[apt.id]}
                    >
                        <MessageCircle size={16} />
                        {actionLoading[apt.id] === 'message' ? 'Bekleyin...' : 'Mesaj Gönder'}
                    </button>
                </div>
            )}
        </div>
    );

    if (profileLoading) {
        return (
            <div className="butcher-appointments-page">
                <div className="container">
                    <div className="loading-state">Yükleniyor...</div>
                </div>
            </div>
        );
    }

    // --- CREATE / EDIT PROFILE VIEW ---
    if (!hasProfile || isEditing) {
        const isEditMode = hasProfile && isEditing;
        return (
            <div className="butcher-appointments-page">
                <div className="container">
                    <div className="butcher-profile-form-card">
                        <div className="form-card-header">
                            <h1>
                                {isEditMode ? 'Profili Düzenle' : 'Kasap İlanı Oluştur'}
                            </h1>
                            {isEditMode && (
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="back-btn"
                                >
                                    <ArrowLeft size={16} /> Geri
                                </button>
                            )}
                        </div>
                        <p className="form-card-subtitle">
                            {isEditMode
                                ? 'Profil bilgilerinizi aşağıdan güncelleyebilirsiniz.'
                                : 'Kasaplık hizmetlerinizi sunmak ve randevu alabilmek için profilinizi oluşturun.'}
                        </p>

                        {createError && (
                            <div className="error-banner">
                                {createError}
                            </div>
                        )}

                        <form onSubmit={isEditMode ? handleUpdateProfile : handleCreateProfile}>
                            <div className="form-group">
                                <label>İsim *</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={profileData.first_name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Adınız"
                                />
                            </div>
                            <div className="form-group">
                                <label>Soyisim *</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={profileData.last_name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Soyadınız"
                                />
                            </div>
                            <div className="form-group">
                                <label>Şehir *</label>
                                <select
                                    name="city"
                                    value={profileData.city}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Şehir Seçin</option>
                                    {cities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>İlçe</label>
                                <select
                                    name="district"
                                    value={profileData.district}
                                    onChange={handleInputChange}
                                    disabled={!profileData.city}
                                >
                                    <option value="">{profileData.city ? 'İlçe Seçin' : 'Önce Şehir Seçin'}</option>
                                    {districts.map(district => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Hizmetler (Virgülle ayırın)</label>
                                <input
                                    type="text"
                                    name="services"
                                    value={profileData.services}
                                    onChange={handleInputChange}
                                    placeholder="Örn: Kesim, Paylama, Teslimat"
                                />
                            </div>
                            <div className="form-group">
                                <label>Fiyat Aralığı</label>
                                <input
                                    type="text"
                                    name="price_range"
                                    value={profileData.price_range}
                                    onChange={handleInputChange}
                                    placeholder="Örn: 5000 - 10000 TL"
                                />
                            </div>

                            <button
                                type="submit"
                                className="complete-btn"
                                disabled={createLoading}
                            >
                                {createLoading
                                    ? (isEditMode ? 'Güncelleniyor...' : 'Oluşturuluyor...')
                                    : (isEditMode ? 'Değişiklikleri Kaydet' : 'Profil Oluştur ve Devam Et')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // --- DASHBOARD VIEW (APPOINTMENTS) ---
    return (
        <div className="butcher-appointments-page">
            <div className="container appointments-content">
                {/* Modern Banner Header */}
                <div className="butcher-panel-banner">
                    <div className="butcher-panel-banner__bg"></div>
                    <button onClick={() => navigate('/')} className="back-btn butcher-back-btn">
                        <ArrowLeft size={18} /> Ana Sayfa
                    </button>
                    <div className="butcher-panel-banner__content">
                        <div className="butcher-panel-banner__info">
                            <h1>Kasap Paneli</h1>
                            <p>Gelen randevu isteklerinizi ve ilanınızı yönetin</p>
                        </div>
                        <button onClick={startEditing} className="butcher-edit-btn">
                            <Edit3 size={16} />
                            Profili Düzenle
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">Randevular yükleniyor...</div>
                ) : error ? (
                    <div className="error-state">
                        <p>{error}</p>
                        <button onClick={loadAppointments} className="btn-primary">Tekrar Dene</button>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="empty-state">
                        <p>Henüz randevu talebi bulunmamaktadır.</p>
                    </div>
                ) : (
                    <div className="appointments-sections">
                        {/* Pending Section */}
                        {pending.length > 0 && (
                            <section className="appointments-section">
                                <h2 className="section-title">
                                    <span className="title-badge pending-badge">{pending.length}</span>
                                    Bekleyen Talepler
                                </h2>
                                <div className="appointments-grid">
                                    {pending.map(apt => renderAppointmentCard(apt, true))}
                                </div>
                            </section>
                        )}

                        {/* Approved Section */}
                        {approved.length > 0 && (
                            <section className="appointments-section">
                                <h2 className="section-title">
                                    <span className="title-badge approved-badge">{approved.length}</span>
                                    Onaylanmış Randevular
                                </h2>
                                {Object.entries(approvedByDate)
                                    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
                                    .map(([date, apts]) => (
                                        <div key={date} className="date-group">
                                            <h3 className="date-header">{formatDate(date)}</h3>
                                            <div className="appointments-grid">
                                                {apts.map(apt => renderAppointmentCard(apt, false))}
                                            </div>
                                        </div>
                                    ))}
                            </section>
                        )}

                        {/* Rejected/Cancelled Section */}
                        {(rejected.length > 0 || cancelled.length > 0) && (
                            <section className="appointments-section">
                                <h2 className="section-title">
                                    <span className="title-badge rejected-badge">
                                        {rejected.length + cancelled.length}
                                    </span>
                                    Reddedilen / İptal Edilen
                                </h2>
                                <div className="appointments-grid">
                                    {[...rejected, ...cancelled].map(apt => renderAppointmentCard(apt, false))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ButcherPanel;
