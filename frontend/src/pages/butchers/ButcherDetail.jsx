import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

import { fetchButcherProfile } from '../../api/butchers';
import {
    fetchButcherReviews,
    fetchMyReview,
    submitReview,
    updateReview,
    deleteReview,
} from '../../api/reviews';
import './ButcherDetail.css';
import { MapPin } from '../../ui/icons';
import SEO from '../../components/SEO';
import { generateButcherStructuredData } from '../../utils/structuredData';

/* ─── Star Rating Widget ─────────────────────────────────── */
const StarRating = ({ value, onChange, readonly = false, size = 28 }) => {
    const [hovered, setHovered] = useState(0);

    return (
        <div className="star-rating" aria-label={`Puan: ${value} / 5`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className={`star-btn ${(hovered || value) >= star ? 'filled' : ''}`}
                    style={{ fontSize: size, cursor: readonly ? 'default' : 'pointer' }}
                    onClick={() => !readonly && onChange && onChange(star)}
                    onMouseEnter={() => !readonly && setHovered(star)}
                    onMouseLeave={() => !readonly && setHovered(0)}
                    aria-label={`${star} yıldız`}
                    disabled={readonly}
                >
                    ★
                </button>
            ))}
        </div>
    );
};

/* ─── Single Review Card ─────────────────────────────────── */
const ReviewCard = ({ review }) => (
    <div className="review-card">
        <div className="review-header">
            <span className="reviewer-name">{review.reviewer_name}</span>
            <StarRating value={review.rating} readonly size={18} />
        </div>
        {review.comment && <p className="review-comment">{review.comment}</p>}
        <span className="review-date">
            {new Date(review.created_at).toLocaleDateString('tr-TR')}
        </span>
    </div>
);

/* ─── Main Page ──────────────────────────────────────────── */
const ButcherDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [butcher, setButcher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [reviews, setReviews] = useState([]);
    const [myReview, setMyReview] = useState(null); // null = not submitted yet
    const [reviewLoading, setReviewLoading] = useState(false);

    // Form state
    const [formRating, setFormRating] = useState(0);
    const [formComment, setFormComment] = useState('');
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadButcher();
        loadReviews();
    }, [id]);

    useEffect(() => {
        if (user) loadMyReview();
    }, [id, user]);

    const loadButcher = async () => {
        try {
            const data = await fetchButcherProfile(id);
            setButcher(data);
        } catch (err) {
            console.error('Failed to load butcher:', err);
            setError('Kasap bilgileri yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const loadReviews = async () => {
        try {
            const data = await fetchButcherReviews(id);
            setReviews(data);
        } catch (err) {
            console.error('Failed to load reviews:', err);
        }
    };

    const loadMyReview = async () => {
        try {
            const data = await fetchMyReview(id);
            setMyReview(data);
            setFormRating(data.rating);
            setFormComment(data.comment || '');
        } catch (err) {
            // 404 means no review yet – that's fine
            if (err?.response?.status !== 404) {
                console.error('Failed to load my review:', err);
            }
            setMyReview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');

        if (!formRating) {
            setFormError('Lütfen bir puan seçin.');
            return;
        }

        setReviewLoading(true);
        try {
            if (myReview && isEditing) {
                await updateReview(id, { rating: formRating, comment: formComment });
                setFormSuccess('Puanınız güncellendi!');
            } else {
                await submitReview(id, { rating: formRating, comment: formComment });
                setFormSuccess('Puanınız kaydedildi!');
            }
            setIsEditing(false);
            await Promise.all([loadMyReview(), loadReviews(), loadButcher()]);
        } catch (err) {
            const msg = err?.response?.data?.error || 'Bir hata oluştu.';
            setFormError(msg);
        } finally {
            setReviewLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Puanınızı silmek istediğinizden emin misiniz?')) return;
        setReviewLoading(true);
        try {
            await deleteReview(id);
            setMyReview(null);
            setFormRating(0);
            setFormComment('');
            setFormSuccess('Puanınız silindi.');
            await Promise.all([loadReviews(), loadButcher()]);
        } catch (err) {
            setFormError('Silme işlemi başarısız.');
        } finally {
            setReviewLoading(false);
        }
    };

    /* ── Loading / Error states ── */
    if (loading) {
        return (
            <div className="butcher-detail-page">
                <div className="container">
                    <div className="loading-state">Yükleniyor...</div>
                </div>
            </div>
        );
    }

    if (error || !butcher) {
        return (
            <div className="butcher-detail-page">
                <div className="container">
                    <div className="error-state">
                        <p>{error || 'Kasap bulunamadı'}</p>
                        <button onClick={() => navigate('/butchers')} className="btn-primary">
                            Kasaplar Listesine Dön
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Is logged-in user the butcher owner? ── */
    const isOwner = user && butcher.user === user.id;

    return (
        <div className="butcher-detail-page">
            {butcher && (
                <>
                    <SEO
                        title={`Kasap ${butcher.butcher_name}`}
                        description={`${butcher.city} bölgesinde ${butcher.experience_years} yıllık tecrübesiyle hizmet veren profesyonel kasap.`}
                        keywords={`kasap, ${butcher.city} kasap, kurban kesimi, ${butcher.butcher_name}`}
                        url={`https://kurbanlink.com/butchers/${id}`}
                    />
                    <script type="application/ld+json">
                        {generateButcherStructuredData(butcher)}
                    </script>
                </>
            )}

            <div className="container detail-content">
                <div className="detail-header">
                    <div className="detail-header-left">
                        {butcher.profile_image_url ? (
                            <img
                                src={butcher.profile_image_url}
                                alt={butcher.butcher_name}
                                className="detail-avatar"
                            />
                        ) : (
                            <div className="detail-avatar-placeholder">
                                {butcher.butcher_name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="header-text">
                            <h1>{butcher.butcher_name}</h1>
                            <p className="location">
                                <MapPin size={14} style={{ marginRight: '0.25rem' }} />
                                {butcher.city}
                            </p>
                            {/* Aggregate rating display */}
                            {butcher.rating > 0 && (
                                <div className="aggregate-rating">
                                    <StarRating value={Math.round(butcher.rating)} readonly size={20} />
                                    <span className="rating-value">{butcher.rating.toFixed(1)}</span>
                                    <span className="rating-count">({reviews.length} değerlendirme)</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={() => navigate('/butchers')} className="btn-secondary">
                        ← Geri
                    </button>
                </div>

                <div className="detail-card">
                    <section className="info-section">
                        <h3>Bilgiler</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="label">Deneyim:</span>
                                <span className="value">{butcher.experience_years} yıl</span>
                            </div>
                            {butcher.price_range && (
                                <div className="info-item">
                                    <span className="label">Fiyat Aralığı:</span>
                                    <span className="value">{butcher.price_range}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="services-section">
                        <h3>Hizmetler</h3>
                        {butcher.services && butcher.services.length > 0 ? (
                            <div className="services-list">
                                {butcher.services.map((service, index) => (
                                    <span key={index} className="service-badge-large">
                                        ✓ {service}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data">Hizmet bilgisi girilmemiş.</p>
                        )}
                    </section>

                    <section className="cta-section">
                        {isOwner ? (
                            <div className="owner-actions">
                                <Link to="/butcher/appointments" className="btn-primary btn-large">
                                    Randevularımı Yönet
                                </Link>
                                <Link to="/profile" className="btn-secondary btn-large" style={{ marginTop: '1rem', display: 'block', textAlign: 'center' }}>
                                    Profilimi Düzenle
                                </Link>
                            </div>
                        ) : user ? (
                            <Link to={`/butchers/${id}/book`} className="btn-primary btn-large">
                                Randevu Al
                            </Link>
                        ) : (
                            <div className="auth-required">
                                <button className="btn-primary btn-large" disabled>
                                    Randevu Al
                                </button>
                                <p className="helper-text">
                                    Randevu almak için <Link to="/login">giriş yapmalısınız</Link>.
                                </p>
                            </div>
                        )}
                    </section>
                </div>

                {/* ── Reviews section ── */}
                <div className="reviews-section">
                    <h2>Değerlendirmeler</h2>

                    {/* Submit / edit form – only for logged-in non-owners */}
                    {user && !isOwner && (
                        <div className="review-form-card">
                            {myReview && !isEditing ? (
                                /* Show existing review with edit/delete controls */
                                <div>
                                    <p className="form-label">Puanınız</p>
                                    <StarRating value={myReview.rating} readonly size={24} />
                                    {myReview.comment && (
                                        <p className="my-comment">{myReview.comment}</p>
                                    )}
                                    <div className="review-actions">
                                        <button
                                            className="btn-secondary btn-sm"
                                            onClick={() => { setIsEditing(true); setFormSuccess(''); }}
                                        >
                                            Düzenle
                                        </button>
                                        <button
                                            className="btn-danger btn-sm"
                                            onClick={handleDelete}
                                            disabled={reviewLoading}
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* New / edit form */
                                <form onSubmit={handleSubmit} className="review-form">
                                    <p className="form-label">
                                        {isEditing ? 'Puanınızı güncelleyin' : 'Bu kasabı değerlendirin'}
                                    </p>
                                    <StarRating
                                        value={formRating}
                                        onChange={setFormRating}
                                        size={32}
                                    />
                                    <textarea
                                        className="review-textarea"
                                        placeholder="Yorumunuz (opsiyonel)..."
                                        value={formComment}
                                        onChange={(e) => setFormComment(e.target.value)}
                                        rows={3}
                                        maxLength={500}
                                    />
                                    {formError && <p className="form-error">{formError}</p>}
                                    {formSuccess && <p className="form-success">{formSuccess}</p>}
                                    <div className="review-actions">
                                        <button
                                            type="submit"
                                            className="btn-primary btn-sm"
                                            disabled={reviewLoading || !formRating}
                                        >
                                            {reviewLoading ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Gönder'}
                                        </button>
                                        {isEditing && (
                                            <button
                                                type="button"
                                                className="btn-secondary btn-sm"
                                                onClick={() => { setIsEditing(false); setFormRating(myReview?.rating || 0); setFormComment(myReview?.comment || ''); }}
                                            >
                                                İptal
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {!user && (
                        <p className="login-prompt">
                            <Link to="/login">Giriş yapın</Link> ve bu kasabı değerlendirin.
                        </p>
                    )}

                    {/* Review list */}
                    {reviews.length === 0 ? (
                        <p className="no-reviews">Henüz değerlendirme yok. İlk siz yazın!</p>
                    ) : (
                        <div className="review-list">
                            {reviews.map((r) => (
                                <ReviewCard key={r.id} review={r} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ButcherDetail;
