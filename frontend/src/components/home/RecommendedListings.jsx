import React, { useState, useEffect } from 'react';
import { recommendationService } from '../../api/recommendations';
import { fetchAnimalImages } from '../../api/animals';
import ListingCard from '../ListingCard';
import './RecommendedListings.css';

const RecommendedListings = () => {
    const [items, setItems] = useState([]);
    const [images, setImages] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch recommendations (default limit 4 for single row)
                const data = await recommendationService.getRecommendedListings({ limit: 4 });
                const recItems = data.items || [];
                setItems(recItems);

                // Fetch images for each listing
                const imageMap = {};
                for (const item of recItems) {
                    try {
                        const imgs = await fetchAnimalImages(item.listing.id);
                        const primary = imgs.find(img => img.is_primary) || imgs[0];
                        if (primary) {
                            imageMap[item.listing.id] = primary;
                        }
                    } catch (e) {
                        // Ignore image fetch errors
                    }
                }
                setImages(imageMap);
            } catch (err) {
                console.error("Failed to load recommendations", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return (
            <div className="recommended-section loading">
                <div className="skeleton-header"></div>
                <div className="skeleton-grid">
                    {[1, 2, 3, 4].map(n => (
                        <div key={n} className="skeleton-card"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (items.length === 0) return null;

    return (
        <div className="recommended-section">
            <h2 className="section-title">
                <span className="icon">✨</span> Sizin İçin Önerilenler
            </h2>
            <div className="listings-grid">
                {items.map((item) => (
                    <div key={item.listing.id} className="recommended-item-wrapper">
                        {/* Optional: Show reason badge */}
                        {item.reasons && item.reasons.length > 0 && (
                            <div className="recommendation-reason">
                                {getReasonLabel(item.reasons[0])}
                            </div>
                        )}
                        <ListingCard
                            listing={item.listing}
                            image={images[item.listing.id]}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

// Helper for user-friendly reason labels
const getReasonLabel = (reason) => {
    switch (reason) {
        case 'SAME_CITY': return 'Şehrinizden';
        case 'SAME_DISTRICT': return 'Yakınınızda';
        case 'POPULAR': return 'Popüler';
        case 'NEW_LISTING': return 'Yeni Eklenen';
        default: return 'Özel Seçim';
    }
};

export default RecommendedListings;
