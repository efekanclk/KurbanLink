import React from 'react';
import { useNavigate } from 'react-router-dom';
import { animalTypeLabel } from '../utils/labels';
import { formatTRY, formatKg, formatAge } from '../utils/format';
import './ListingCard.css';

const ListingCard = ({ listing, image, badgeText = null }) => {
    const navigate = useNavigate();

    // Animal type display mapping
    const typeMap = {
        'SMALL': 'Küçükbaş',
        'LARGE': 'Büyükbaş',
        'KUCUKBAS': 'Küçükbaş',
        'BUYUKBAS': 'Büyükbaş'
    };

    // Image fallback
    const displayImage = image?.image_url || image?.image || 'https://via.placeholder.com/400x300?text=Resim+Yok';

    // Badge class mapping
    const badgeClass = badgeText === 'Yeni' ? 'badge-yeni'
        : badgeText === 'Uygun Fiyat' ? 'badge-uygun'
            : badgeText === 'Popüler' ? 'badge-populer'
                : '';

    return (
        <div className="listing-card" onClick={() => navigate(`/animals/${listing.id}`)}>
            <div className="card-image-wrapper">
                {badgeText && (
                    <span className={`card-badge ${badgeClass}`}>{badgeText}</span>
                )}
                <img src={displayImage} alt={listing.title || listing.breed || 'İlan'} className="card-image" />
            </div>

            <div className="card-content">
                <h3 className="card-title">
                    {listing.title || listing.breed || 'İlan'}
                </h3>

                <div className="card-meta">
                    {listing.age_display && (
                        <span className="meta-item">
                            <svg className="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {listing.age_display}
                        </span>
                    )}
                    {listing.weight && (
                        <span className="meta-item">
                            <svg className="meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                            {formatKg(listing.weight)}
                        </span>
                    )}
                </div>

                <div className="card-footer">
                    {listing.city && (
                        <span className="card-location">
                            <svg className="location-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {listing.city}
                        </span>
                    )}
                    <span className="card-price">{formatTRY(listing.price)}</span>
                </div>
            </div>
        </div>
    );
};

export default ListingCard;
