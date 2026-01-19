import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HomeHero from '../components/home/HomeHero';
import FeaturedSection from '../components/home/FeaturedSection';
import { fetchAnimals, fetchAnimalImages } from '../api/animals';
import { useAuth } from '../auth/AuthContext';
import './Home.css';

const Home = () => {
    const { user, isInitializing } = useAuth();
    const [featuredListings, setFeaturedListings] = useState([]);
    const [images, setImages] = useState({});
    const [breeds, setBreeds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadFeatured = async () => {
            try {
                // Fetch first page
                const data = await fetchAnimals({ page: 1 });
                // Take first 8 for featured
                const listings = data.results.slice(0, 8);
                setFeaturedListings(listings);

                // Extract unique breeds
                const uniqueBreeds = [...new Set(
                    listings
                        .map(l => l.breed)
                        .filter(breed => breed && breed.trim())
                )];
                setBreeds(uniqueBreeds);

                // Fetch images
                const imageMap = {};
                for (const listing of listings) {
                    try {
                        const imgs = await fetchAnimalImages(listing.id);
                        const primary = imgs.find(img => img.is_primary) || imgs[0];
                        if (primary) imageMap[listing.id] = primary;
                    } catch (e) {
                        // Ignore individual image errors
                    }
                }
                setImages(imageMap);
            } catch (error) {
                console.error("Failed to load featured listings", error);
            } finally {
                setLoading(false);
            }
        };

        loadFeatured();
    }, []);

    return (
        <div className="home-page">
            <Navbar />
            <HomeHero breeds={breeds} />

            {/* Seller CTAs - only show after auth initialization to prevent flicker */}
            {!isInitializing && user && (
                <div className="cta-banner">
                    <h2>🎯 İlan Oluştur</h2>
                    <p>Kurban hayvanınızı satışa çıkarın</p>
                    <Link to="/seller/listings/new" className="cta-button">
                        Yeni İlan Oluştur
                    </Link>
                </div>
            )}

            {loading ? (
                <div className="container loading-container">
                    <div className="loading-state">Yükleniyor...</div>
                </div>
            ) : (
                <FeaturedSection listings={featuredListings} images={images} />
            )}
        </div>
    );
};

export default Home;
