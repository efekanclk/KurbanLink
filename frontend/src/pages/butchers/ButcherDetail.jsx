import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

import { fetchButcherProfile } from '../../api/butchers';
import './ButcherDetail.css';
import { MapPin } from '../../ui/icons';
import SEO from '../../components/SEO';
import { generateButcherStructuredData } from '../../utils/structuredData';

const ButcherDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [butcher, setButcher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadButcher();
    }, [id]);

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
                    <div>
                        <h1>{butcher.butcher_name}</h1>
                        <p className="location">
                            <MapPin size={14} style={{ marginRight: '0.25rem' }} />
                            {butcher.city}
                        </p>
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
                        {user ? (
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
            </div>
        </div>
    );
};

export default ButcherDetail;
