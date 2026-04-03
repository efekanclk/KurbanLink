import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './ButcherCard.css';

const ButcherCard = ({ butcher }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const isOwner = user && butcher.user === user.id;

    return (
        <div className="butcher-card">
            <div className="butcher-header">
                {butcher.profile_image_url ? (
                    <img
                        src={butcher.profile_image_url}
                        alt={butcher.butcher_name}
                        className="butcher-avatar"
                    />
                ) : (
                    <div className="butcher-avatar-placeholder">
                        {butcher.butcher_name?.charAt(0).toUpperCase()}
                    </div>
                )}
                <div className="butcher-title-info">
                    <h3>{butcher.butcher_name}</h3>
                    <p className="city">{butcher.city}</p>
                </div>
            </div>

            {butcher.services && butcher.services.length > 0 && (
                <div className="services">
                    {butcher.services.slice(0, 3).map((service, index) => (
                        <span key={index} className="service-badge">
                            {service}
                        </span>
                    ))}
                    {butcher.services.length > 3 && (
                        <span className="service-more">
                            +{butcher.services.length - 3} daha
                        </span>
                    )}
                </div>
            )}

            <div className="butcher-actions">
                {isOwner ? (
                    <>
                        <button
                            className="btn-primary btn-manage"
                            onClick={() => navigate('/butcher/appointments')}
                        >
                            Randevularımı Yönet
                        </button>
                        <button
                            className="btn-secondary btn-view"
                            onClick={() => navigate(`/butchers/${butcher.hashed_id || butcher.id}`)}
                        >
                            Profilimi Gör
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className="btn-primary btn-book"
                            onClick={() => navigate(`/butchers/${butcher.hashed_id || butcher.id}/book`)}
                        >
                            Randevu Al
                        </button>
                        <button
                            className="btn-secondary btn-view"
                            onClick={() => navigate(`/butchers/${butcher.hashed_id || butcher.id}`)}
                        >
                            Profili Gör
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ButcherCard;
