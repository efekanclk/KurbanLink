import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { fetchAnimals, fetchAnimalImages } from '../api/animals';
import NotificationDropdown from '../components/NotificationDropdown';
import './AnimalsList.css';

const AnimalsList = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const { isFavorited, toggleFavorite, toggleLoading } = useFavorites();
    const [listings, setListings] = useState([]);
    const [listingImages, setListingImages] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [favoriteError, setFavoriteError] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const loadListings = async (page = 1) => {
        setLoading(true);
        setError(null);

        try {
            const paginatedData = await fetchAnimals(page);  // Returns { count, next, previous, results }
            const data = paginatedData.results;  // Extract results array

            setListings(data);
            setTotalCount(paginatedData.count);
            setCurrentPage(page);
            setTotalPages(Math.ceil(paginatedData.count / 10));  // Backend page_size = 10

            // Fetch images for all listings
            const imagePromises = data.map(listing =>
                fetchAnimalImages(listing.id)
                    .then(images => ({ listingId: listing.id, images }))
                    .catch(() => ({ listingId: listing.id, images: [] }))
            );

            const allImages = await Promise.all(imagePromises);

            // Build images map
            const imagesMap = {};
            allImages.forEach(({ listingId, images }) => {
                // Find primary image or use first image
                const primaryImage = images.find(img => img.is_primary);
                imagesMap[listingId] = primaryImage || images[0] || null;
            });

            setListingImages(imagesMap);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load listings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadListings(1);
    }, []);

    const handleFavoriteToggle = async (e, listingId) => {
        e.stopPropagation();
        setFavoriteError(prev => ({ ...prev, [listingId]: null }));

        const result = await toggleFavorite(listingId);
        if (!result.success) {
            setFavoriteError(prev => ({ ...prev, [listingId]: result.error }));
            setTimeout(() => {
                setFavoriteError(prev => ({ ...prev, [listingId]: null }));
            }, 3000);
        }
    };

    if (loading) {
        return (
            <div className="animals-container">
                <div className="animals-header">
                    <h1>Hayvan İlanları</h1>
                    <div className="header-actions">
                        <button onClick={() => navigate('/favorites')} className="favorites-link-btn">Favorilerim</button>
                        <button onClick={logout} className="logout-btn">Çıkış</button>
                    </div>
                </div>
                <div className="loading">İlanlar yükleniyor...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="animals-container">
                <div className="animals-header">
                    <h1>Animal Listings</h1>
                    <div className="header-actions">
                        <button onClick={() => navigate('/favorites')} className="favorites-link-btn">Favorites</button>
                        <button onClick={logout} className="logout-btn">Logout</button>
                    </div>
                </div>
                <div className="error-container">
                    <p className="error">{error}</p>
                    <button onClick={loadListings}>Tekrar Dene</button>
                </div>
            </div>
        );
    }

    if (listings.length === 0) {
        return (
            <div className="animals-container">
                <div className="animals-header">
                    <h1>Animal Listings</h1>
                    <div className="header-actions">
                        <button onClick={() => navigate('/favorites')} className="favorites-link-btn">Favorites</button>
                        <button onClick={logout} className="logout-btn">Logout</button>
                    </div>
                </div>
                <div className="empty-state">İlan bulunamadı.</div>
            </div>
        );
    }

    return (
        <div className="animals-container">
            <div className="animals-header">
                <h1>Hayvan İlanları</h1>
                <div className="header-actions">
                    <button onClick={() => navigate('/butchers')} className="favorites-link-btn">
                        🏪 Kasaplar
                    </button>
                    <button onClick={() => navigate('/messages')} className="favorites-link-btn">
                        💬 Mesajlar
                    </button>
                    <button onClick={() => navigate('/notifications')} className="favorites-link-btn">
                        🔔 Bildirimler
                    </button>
                    <NotificationDropdown />
                    <button onClick={() => navigate('/favorites')} className="favorites-link-btn">
                        ⭐ Favorilerim
                    </button>
                    <button onClick={() => navigate('/profile')} className="favorites-link-btn">
                        👤 Profilim
                    </button>
                    {user && ( // Show to all authenticated users
                        <Link to="/seller/listings/new" className="favorites-link-btn">
                            + Yeni İlan Oluştur
                        </Link>
                    )}
                    {user?.roles && user.roles.includes('BUTCHER') && (
                        <>
                            <button onClick={() => navigate('/butcher/appointments')} className="favorites-link-btn">
                                📅 Randevularım
                            </button>
                            <button onClick={() => navigate('/butcher/profile')} className="favorites-link-btn">
                                👤 Kasap Profilim
                            </button>
                        </>
                    )}
                    <button onClick={logout} className="logout-btn">Çıkış Yap</button>
                </div>
            </div>

            <div className="animals-grid">
                {listings.map(listing => {
                    const image = listingImages[listing.id];
                    const favorited = isFavorited(listing.id);
                    const isTogglingFavorite = toggleLoading[listing.id];

                    return (
                        <div
                            key={listing.id}
                            className="animal-card"
                            onClick={() => navigate(`/animals/${listing.id}`)}
                        >
                            <button
                                className={`favorite-btn ${favorited ? 'favorited' : ''}`}
                                onClick={(e) => handleFavoriteToggle(e, listing.id)}
                                disabled={isTogglingFavorite}
                                title={favorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                            >
                                {favorited ? '★' : '☆'}
                            </button>

                            <div className="animal-image">
                                {image ? (
                                    <img src={image.image_url} alt={`${listing.animal_type} ${listing.title || listing.breed}`} />
                                ) : (
                                    <div className="image-placeholder">Resim Yok</div>
                                )}
                            </div>

                            <div className="animal-details">
                                <h3>{listing.title || listing.breed || 'İsimsiz İlan'}</h3>

                                {favoriteError[listing.id] && (
                                    <div className="inline-error">{favoriteError[listing.id]}</div>
                                )}

                                <div className="animal-info">
                                    <div className="info-row">
                                        <span className="label">Fiyat:</span>
                                        <span className="value">${listing.price}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Konum:</span>
                                        <span className="value">{listing.location}</span>
                                    </div>
                                    {listing.age && (
                                        <div className="info-row">
                                            <span className="label">Yaş:</span>
                                            <span className="value">{listing.age} yaşında</span>
                                        </div>
                                    )}
                                    {listing.weight && (
                                        <div className="info-row">
                                            <span className="label">Ağırlık:</span>
                                            <span className="value">{listing.weight} kg</span>
                                        </div>
                                    )}
                                    <div className="info-row">
                                        <span className="label">Satıcı:</span>
                                        <span className="value seller">{listing.seller_email}</span>
                                    </div>
                                </div>

                                {listing.description && (
                                    <p className="description">{listing.description}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AnimalsList;
