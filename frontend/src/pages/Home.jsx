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
                title="Kurban Al | Kurbanlık Hayvan İlanları"
                description="Kurban al, kurban sat — Türkiye'nin güvenilir kurbanlık hayvan platformu. Büyükbaş (dana, tosun) ve küçükbaş (koyun, kuzu) kurban ilanları. Hisseli kurban ve kasap randevusu imkânı."
                keywords="kurban al, büyükbaş kurban, küçükbaş kurban, hisseli kurban, kurbanlık hayvan ilanı, kurban link, online kurban alım"
                url="https://kurbanlink.com/"
            />
            {/* FAQ JSON-LD Schema */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": [
                        {
                            "@type": "Question",
                            "name": "KurbanLink'ten nasıl kurban hayvanı alabilirim?",
                            "acceptedAnswer": { "@type": "Answer", "text": "KurbanLink üzerinden kurban hayvanı almak çok kolay: İlanları inceleyin, beğendiğinizi favorilere ekleyin ve satıcıyla mesajlaşın. Tüm işlem güvenli ve hızlıca tamamlanır." }
                        },
                        {
                            "@type": "Question",
                            "name": "KurbanLink'te büyükbaş hayvan ilanları var mı?",
                            "acceptedAnswer": { "@type": "Answer", "text": "Evet! Dana, tosun, düve ve manda gibi tüm büyükbaş kurbanlık hayvan ilanları KurbanLink'te yer almaktadır. İlanlar günlük olarak güncellenir." }
                        },
                        {
                            "@type": "Question",
                            "name": "Hisseli kurban ilanları bulabilir miyim?",
                            "acceptedAnswer": { "@type": "Answer", "text": "KurbanLink'te hisseli kurban ortaklıkları da yer almaktadır. Büyükbaş hayvanlar için hissedar arayabilir ya da hisseli kurban ilanı verebilirsiniz." }
                        },
                        {
                            "@type": "Question",
                            "name": "Kurban hayvanını kestirmek için kasap bulmak mı istiyorsunuz?",
                            "acceptedAnswer": { "@type": "Answer", "text": "KurbanLink üzerinden kasap profillerini inceleyebilir, randevu alabilir ve kurban şikriniz için en uygun kasabı bulabilirsiniz." }
                        },
                        {
                            "@type": "Question",
                            "name": "KurbanLink ücretli mi?",
                            "acceptedAnswer": { "@type": "Answer", "text": "KurbanLink'e kayıt olmak ve ilan vermek tamamen ücretsidir. Platform Türkiye genelinde kurban alım satımını kolaylaştırmak için hizmet vermektedir." }
                        }
                    ]
                })
            }} />


            <div className="home-container">
                <HomeSidebar />

                <main className="home-content">
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
                        </div>
                    </section>

                    {/* Recommendations Section */}
                    <RecommendedListings />

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

            {/* SEO Content Section — keyword-rich visible text for Google */}
            <section className="seo-content-section" style={{
                background: '#f8f9fa',
                padding: '3rem 1.5rem',
                borderTop: '1px solid #e9ecef'
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <h2 style={{ color: '#1a5c30', fontSize: '1.5rem', marginBottom: '1rem' }}>
                        Türkiye'nin Kurbanlık Hayvan Platformu: KurbanLink
                    </h2>
                    <p style={{ color: '#444', lineHeight: '1.8', marginBottom: '1rem' }}>
                        <strong>Kurban al</strong>, kurban sat, kasap bul — KurbanLink'te her şeyi tek yerde bulursunuz.
                        <strong> Büyükbaş kurban</strong> arayanlar için dana, tosun, düve ve manda ilanları;
                        <strong> küçükbaş kurban</strong> arayanlar için koyun, kuzu ve keçi ilanları.
                    </p>
                    <p style={{ color: '#444', lineHeight: '1.8', marginBottom: '1rem' }}>
                        <strong>Hisseli kurban</strong> ortaklığı arıyor musunuz? KurbanLink'te büyükbaş hayvanlar için
                        hissedar bulabilir ya da kendiçi ilanınızı verebilirsiniz. <strong>Online kurban alımı</strong>
                        artık çok daha güvenli ve kolay.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.5rem' }}>
                        {['Kurban Al', 'Büyükbaş Kurban', 'Küçükbaş Kurban', 'Dana Kurban', 'Koyun Kurban',
                            'Tosun Kurban', 'Hisseli Kurban', 'Kasap Randevu', 'Kurban İlanı', 'Online Kurban'].map(tag => (
                                <span key={tag} style={{
                                    background: '#e8f5ee', color: '#1a5c30',
                                    padding: '0.3rem 0.8rem', borderRadius: '999px',
                                    fontSize: '0.85rem', fontWeight: '500'
                                }}>{tag}</span>
                            ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
