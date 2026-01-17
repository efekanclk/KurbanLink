import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { fetchAnimalImages } from '../api/animals';
import './Favorites.css';

const Favorites = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { favorites, loading: favoritesLoading } = useFavorites();
    const [listings, setListings] = useState([]);
    const [listingImages, setListingImages] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadFavoriteListings = async () => {
        if (favoritesLoading) return;

        setLoading(true);
        setError(null);

        try {
            // Use animal_details directly from favorites response
            const favoriteListings = favorites
                .map(fav => fav.animal_details)
                .filter(Boolean);

            setListings(favoriteListings);

            // Fetch images for favorite listings
            const imagePromises = favoriteListings.map(listing =>
                fetchAnimalImages(listing.id)
                    .then(images => ({ listingId: listing.id, images }))
                    .catch(err => {
                        console.error(`Failed to load images for listing ${listing.id}:`, err);
                        return { listingId: listing.id, images: [] };
                    })
            );

            const allImages = await Promise.all(imagePromises);

            // Build images map
            const imagesMap = {};
            allImages.forEach(({ listingId, images }) => {
                const primaryImage = images.find(img => img.is_primary);
                imagesMap[listingId] = primaryImage || images[0] || null;
            });

            setListingImages(imagesMap);
        } catch (err) {
            console.error('Favorites load error:', err);
            setError(err.response?.data?.detail || 'Failed to load favorite listings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFavoriteListings();
    }, [favorites, favoritesLoading]);

    if (loading || favoritesLoading) {
        return (
            <div className="favorites-container">
                <div className="favorites-header">
                    <h1>Favorilerim</h1>
                    <div className="header-actions">
                        <button onClick={() => navigate('/')} className="back-btn">
                            ← Geri
                        </button>
                        <button onClick={logout} className="logout-btn">
                            Çıkış Yap
                        </button>
                    </div>
                </div>
                <div className="page">
                    <div className="page__container">
                        <div className="loading">Favoriler yükleniyor...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="favorites-container">
                <div className="favorites-header">
                    <h1>Favorilerim</h1>
                    <div className="header-actions">
                        <button onClick={() => navigate('/')} className="back-btn">
                            ← Geri
                        </button>
                        <button onClick={logout} className="logout-btn">
                            Çıkış Yap
                        </button>
                    </div>
                </div>
                <div className="page">
                    <div className="page__container">
                        <div className="form-card">
                            <p className="error-message">{error}</p>
                            <button onClick={loadFavoriteListings} className="retry-btn">
                                Tekrar Dene
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (listings.length === 0) {
        return (
            <div className="favorites-container">
                <div className="favorites-header">
                    <h1>Favorilerim</h1>
                    <div className="header-actions">
                        <button onClick={() => navigate('/')} className="back-btn">
                            ← Geri
                        </button>
                        <button onClick={logout} className="logout-btn">
                            Çıkış Yap
                        </button>
                    </div>
                </div>
                <div className="page">
                    <div className="page__container">
                        <div className="form-card">
                            <p className="empty-icon">😔</p>
                            <p>Henüz favori yok.</p>
                            <p className="empty-subtitle">İlanları beğenerek favorilere ekleyebilirsiniz.</p>
                            <button onClick={() => navigate('/')} className="browse-btn">
                                İlanları Gör
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="favorites-container">
            <div className="favorites-header">
                <h1>Favorilerim</h1>
                <div className="header-actions">
                    <button onClick={() => navigate('/')} className="back-btn">
                        ← Geri
                    </button>
                    <button onClick={logout} className="logout-btn">
                        Çıkış Yap
                    </button>
                </div>
            </div>

            <div className="page">
                <div className="page__container favorites-grid-container">
                    <div className="favorites-grid">
                        {listings.map(listing => {
                            const image = listingImages[listing.id];

                            return (
                                <div
                                    key={listing.id}
                                    className="favorite-card"
                                    onClick={() => navigate(`/animals/${listing.id}`)}
                                >
                                    {image ? (
                                        <img
                                            src={`http://localhost:8000${image.image}`}
                                            alt={listing.breed}
                                            className="listing-image"
                                        />
                                    ) : (
                                        <div className="no-image">
                                            🐑
                                        </div>
                                    )}

                                    <div className="listing-content">
                                        <div className="listing-header">
                                            <div className="listing-type-breed">
                                                <h3>{listing.breed}</h3>
                                                <span className="type">{listing.animal_type}</span>
                                            </div>
                                        </div>

                                        <div className="listing-info">
                                            <div className="info-row">
                                                <span className="label">Fiyat:</span>
                                                <span className="value price">{listing.price} TL</span>
                                            </div>
                                            <div className="info-row">
                                                <span className="label">Konum:</span>
                                                <span className="value">{listing.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Favorites;
