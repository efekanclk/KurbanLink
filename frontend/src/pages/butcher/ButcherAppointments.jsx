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
import { Calendar, Clock } from '../../ui/icons';
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
            // If 404/403 or network error, assume no profile or handle gracefully
            // If backend returns null for 'me' (as seen in views.py), it goes to 'if (profile)' check above.
            // But if it errors out, setHasProfile(false) might be safe or show error.
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
            loadAppointments(); // Load appointments (likely empty)
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
            await checkProfile(); // Reload data
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
                    <span className="value">{apt.customer_email || apt.customer || 'Bilinmiyor'}</span>
                </div>
                {apt.notes && (
                    <div className="info-row">
                        <span className="label">Not:</span>
                        <span className="value">{apt.notes}</span>
                    </div>
                )}
            </div>

            {showActions && (
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
                    <div className="create-profile-card" style={{ maxWidth: '600px', margin: '40px auto', background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h1 style={{ fontSize: '24px', color: '#1a1a1a', margin: 0 }}>
                                {isEditMode ? 'Profili Düzenle' : 'Kasap İlanı Oluştur'}
                            </h1>
                            {isEditMode && (
                                <button
                                    onClick={() => setIsEditing(false)}
                                    style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '14px' }}
                                >
                                    İptal
                                </button>
                            )}
                        </div>
                        <p style={{ color: '#666', marginBottom: '24px' }}>
                            {isEditMode
                                ? 'Profil bilgilerinizi aşağıdan güncelleyebilirsiniz.'
                                : 'Kasaplık hizmetlerinizi sunmak ve randevu alabilmek için profilinizi oluşturun.'}
                        </p>

                        {createError && (
                            <div className="error-banner" style={{ marginBottom: '20px' }}>
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
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e0e0e0', background: 'white' }}
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
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e0e0e0', background: 'white' }}
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
                                style={{ marginTop: '10px' }}
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
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1>Kasap Paneli</h1>
                        <p className="subtitle">Gelen randevu isteklerinizi ve ilanınızı yönetin</p>
                    </div>
                    <button
                        onClick={startEditing}
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '14px', background: '#2d6a4f', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        Profili Düzenle
                    </button>
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
