import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ButcherCard.css';

const ButcherCard = ({ butcher }) => {
    const navigate = useNavigate();

    return (
        <div className="butcher-card">
            <div className="butcher-header">
                <h3>{butcher.butcher_name}</h3>
                <p className="city">{butcher.city}</p>
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
                <button
                    className="btn-primary btn-book"
                    onClick={() => navigate(`/butchers/${butcher.id}/book`)}
                >
                    Randevu Al
                </button>
                <button
                    className="btn-secondary btn-view"
                    onClick={() => navigate(`/butchers/${butcher.id}`)}
                >
                    Profili Gör
                </button>
            </div>
        </div>
    );
};

export default ButcherCard;
