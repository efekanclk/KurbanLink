import React from 'react';
import { Link } from 'react-router-dom';
import ListingCard from '../ListingCard';
import './FeaturedSection.css';

const FeaturedSection = ({ listings = [], images = {} }) => {
    // Badge logic based on index
    const getBadge = (index) => {
        if (index === 0) return 'Yeni';
        if (index === 1) return 'Uygun Fiyat';
        if (index === 2) return 'Popüler';
        return null;
    };

    return (
        <section className="featured-section">
            <div className="container">
                <div className="section-header">
                    <h2>Öne Çıkan İlanlar</h2>
                    <Link to="/search" className="link-search">
                        Detaylı Arama
                        <svg className="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                <div className="featured-grid">
                    {listings.map((listing, index) => (
                        <ListingCard
                            key={listing.id}
                            listing={listing}
                            image={images[listing.id]}
                            badgeText={getBadge(index)}
                        />
                    ))}

                    {listings.length === 0 && (
                        <div className="empty-state">
                            Henüz öne çıkan ilan bulunmamaktadır.
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default FeaturedSection;
