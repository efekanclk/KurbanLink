import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import Navbar from '../../components/Navbar';
import { fetchButcherProfile, createAppointment } from '../../api/butchers';
import { fetchMyListings } from '../../api/sellers';
import './AppointmentBooking.css';

const TIME_SLOTS = [
    '09:00:00', '09:30:00', '10:00:00', '10:30:00',
    '11:00:00', '11:30:00', '12:00:00', '12:30:00',
    '13:00:00', '13:30:00', '14:00:00', '14:30:00',
    '15:00:00', '15:30:00', '16:00:00', '16:30:00',
    '17:00:00'
];

const AppointmentBooking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [butcher, setButcher] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        date: '',
        time: '',
        listing: '',
        note: ''
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const butcherData = await fetchButcherProfile(id);
            setButcher(butcherData);

            // Load seller's listings if applicable
            if (user) {
                try {
                    const listingsData = await fetchMyListings(user.id);
                    setListings(listingsData.results || listingsData);
                } catch (err) {
                    console.error('Failed to load listings:', err);
                }
            }
        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Sayfa yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const appointmentData = {
                butcher: parseInt(id),
                date: formData.date,
                time: formData.time,
                note: formData.note
            };

            if (formData.listing) {
                appointmentData.listing = parseInt(formData.listing);
            }

            await createAppointment(appointmentData);
            setSuccess(true);

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/profile');
            }, 2000);
        } catch (err) {
            console.error('Failed to create appointment:', err);

            // Handle slot conflict error specifically
            const errorMsg = err.response?.data?.detail
                || err.response?.data?.error
                || 'Randevu oluşturulamadı. Lütfen tekrar deneyin.';

            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="booking-page">
                <Navbar />
                <div className="container">
                    <div className="loading-state">Yükleniyor...</div>
                </div>
            </div>
        );
    }

    if (!butcher) {
        return (
            <div className="booking-page">
                <Navbar />
                <div className="container">
                    <div className="error-state">
                        <p>Kasap bulunamadı</p>
                        <button onClick={() => navigate('/butchers')} className="btn-primary">
                            Kasaplar Listesine Dön
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="booking-page">
                <Navbar />
                <div className="container">
                    <div className="success-card">
                        <svg className="success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2>Randevu Talebiniz Gönderildi!</h2>
                        <p>Kasap onayı bekleniyor. Profilinizden randevularınızı takip edebilirsiniz.</p>
                        <button onClick={() => navigate('/profile')} className="btn-primary">
                            Profilime Git
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Get tomorrow's date for min date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    return (
        <div className="booking-page">
            <Navbar />

            <div className="container booking-content">
                <div className="booking-header">
                    <h1>Randevu Talebi Oluştur</h1>
                    <p className="butcher-info">
                        Kasap: <strong>{butcher.butcher_name}</strong> - {butcher.city}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="booking-form">
                    {error && (
                        <div className="error-banner">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="date">Tarih *</label>
                        <input
                            type="date"
                            id="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                            min={minDate}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="time">Saat *</label>
                        <select
                            id="time"
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            required
                        >
                            <option value="">Saat seçin</option>
                            {TIME_SLOTS.map(slot => (
                                <option key={slot} value={slot}>
                                    {slot.substring(0, 5)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {user && listings.length > 0 && (
                        <div className="form-group">
                            <label htmlFor="listing">İlan (Opsiyonel)</label>
                            <select
                                id="listing"
                                value={formData.listing}
                                onChange={(e) => setFormData({ ...formData, listing: e.target.value })}
                            >
                                <option value="">İlan seçin (opsiyonel)</option>
                                {listings.map(listing => (
                                    <option key={listing.id} value={listing.id}>
                                        {listing.breed} - {listing.animal_type}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="note">Not (Opsiyonel)</label>
                        <textarea
                            id="note"
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            rows="3"
                            placeholder="Randevu hakkında not ekleyebilirsiniz..."
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={() => navigate(`/butchers/${id}`)}
                            className="btn-secondary"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary"
                        >
                            {submitting ? 'Gönderiliyor...' : 'Randevu Talep Et'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AppointmentBooking;
