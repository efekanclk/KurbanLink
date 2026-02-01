import React, { useState, useEffect } from 'react';
import { recommendationService } from '../../api/recommendations';
import { fetchAnimalImages } from '../../api/animals';
import ListingCard from '../ListingCard';
import './SimilarListings.css';

const SimilarListings = ({ currentListing }) => {
    const [items, setItems] = useState([]);
    const [images, setImages] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentListing) return;

        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch recommendations based on current listing's location
                const params = {
                    city: currentListing.city,
                    district: currentListing.district,
                    limit: 4,
                    exclude_ids: currentListing.id // Service sends this as param
                };

                const data = await recommendationService.getRecommendedListings(params);
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
                console.error("Failed to load similar listings", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentListing?.id]); // Re-fetch when current listing changes

    if (loading) {
        return (
            <div className="similar-section loading">
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
        <div className="similar-section">
            <h2 className="section-title">
                Diğer İlanlar
            </h2>
            <div className="listings-grid">
                {items.map((item) => (
                    <div key={item.listing.id} className="similar-item-wrapper">
                        {/* Optional: Show matching reason badge if high score? */}
                        {item.score > 0.4 && item.reasons.includes('SAME_DISTRICT') && (
                            <div className="similarity-badge">
                                Yakın Konum
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

export default SimilarListings;
