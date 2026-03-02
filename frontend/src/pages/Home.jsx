import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import FeaturedSection from '../components/home/FeaturedSection';
import HomeSidebar from '../components/home/HomeSidebar';
import RecommendedListings from '../components/home/RecommendedListings';
import SEO from '../components/SEO';
import { fetchAnimals, fetchAnimalImages } from '../api/animals';
import { useAuth } from '../auth/AuthContext';
import './Home.css';

const Home = () => {
    const { user, isInitializing } = useAuth();
    const [searchParams] = useSearchParams();
    const [featuredListings, setFeaturedListings] = useState([]);
    const [images, setImages] = useState({});
    const [loading, setLoading] = useState(true);

    // Re-fetch when URL params change
    useEffect(() => {
        const loadListings = async () => {
            setLoading(true);
            try {
                // Convert URL params to object for API
                // Filter out empty params manually or rely on backend handling empty strings (usually fine, but cleaner to remove)
                const filters = {};
                for (const [key, value] of searchParams.entries()) {
                    if (value && value !== 'undefined' && value !== 'null') {
                        filters[key] = value;
                    }
                }

                // Fetch listings with filters
                const data = await fetchAnimals({ page: 1, ...filters });
                setFeaturedListings(data.results || []);

                // Fetch images
                const imageMap = {};
                for (const listing of (data.results || [])) {
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
                console.error("Failed to load listings", error);
            } finally {
                setLoading(false);
            }
        };

        loadListings();
    }, [searchParams]);

    return (
        <div className="home-page">
            <SEO
                title="Ana Sayfa"
                description="Kurban hayvanı alım satım platformu. Koyun, kuzu, dana, tosun ve deve ilanları. Güvenilir satıcılardan kurban hayvanı satın alın."
                keywords="kurban, kurban hayvanı, koyun, kuzu, dana, tosun, deve, kurban satışı"
                url="https://kurbanlink.com/"
            />

            <div className="home-container">
                <HomeSidebar />

                <main className="home-content">
                    {/* Recommendations Section */}
                    <RecommendedListings />

                    {/* Hero / Welcome Section */}
                    <section className="hero-welcome">
                        <div className="hero-welcome-inner">
                            <h1 className="hero-welcome-title">
                                Kurban İbadetinizde Güvenilir Köprü:{' '}
                                <span>KurbanLink</span>
                            </h1>
                            <p className="hero-welcome-subtitle">
                                Hisseli veya tekil kurbanlık ilanlarını inceleyin,
                                kasap ve nakliye hizmetlerine tek tıkla ulaşın.
                            </p>
                            <div className="hero-welcome-actions">
                                <Link to="/" className="hero-btn hero-btn-primary">
                                    İlanları İncele
                                </Link>
                                <Link to="/create-listing" className="hero-btn hero-btn-outline">
                                    İlan Ver
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Header for listings */}
                    <div className="listings-header">
                        <h2>Tüm İlanlar</h2>
                        {searchParams.get('search') && (
                            <p className="search-result-text">
                                "{searchParams.get('search')}" için sonuçlar
                            </p>
                        )}
                    </div>



                    {loading ? (
                        <div className="container loading-container">
                            <div className="loading-state">Yükleniyor...</div>
                        </div>
                    ) : featuredListings.length > 0 ? (
                        <FeaturedSection listings={featuredListings} images={images} />
                    ) : (
                        <div className="no-results">
                            <p>Aradığınız kriterlere uygun ilan bulunamadı.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Home;
