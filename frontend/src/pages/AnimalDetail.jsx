import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { fetchAnimal, fetchAnimalImages } from '../api/animals';
import { createConversation } from '../api/messages';
import { deleteListing } from '../api/sellers';
import './AnimalDetail.css';
import { Edit3, Eye, MessageCircle, Heart, Trash2 } from '../ui/icons';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const AnimalDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { isFavorited, toggleFavorite, toggleLoading } = useFavorites();

    const [listing, setListing] = useState(null);
    const [images, setImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [favoriteError, setFavoriteError] = useState(null);
    const [messagingLoading, setMessagingLoading] = useState(false);
    const [messagingError, setMessagingError] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'warning', showCancel: true });

    // Use ref to track latest request ID to prevent race conditions
    const requestIdRef = useRef(0);

    const loadListing = async () => {
        // Increment request ID for this new request
        const currentRequestId = ++requestIdRef.current;

        // Immediately clear stale data and set loading state
        setListing(null);
        setImages([]);
        setSelectedImage(null);
        setLoading(true);
        setError(null);
        setNotFound(false);

        try {
            const [listingData, imagesData] = await Promise.all([
                fetchAnimal(id),
                fetchAnimalImages(id).catch(() => []) // Don't fail on image errors
            ]);

            // Only update state if this is still the latest request
            if (currentRequestId === requestIdRef.current) {
                setListing(listingData);
                setImages(imagesData);

                // Set primary image or first image
                const primary = imagesData.find(img => img.is_primary);
                setSelectedImage(primary || imagesData[0] || null);
            }
        } catch (err) {
            // Only update error state if this is still the latest request
            if (currentRequestId === requestIdRef.current) {
                if (err.response?.status === 404) {
                    setNotFound(true);
                } else {
                    setError(err.response?.data?.detail || 'İlan yüklenemedi.');
                }
            }
        } finally {
            // Only update loading state if this is still the latest request
            if (currentRequestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        loadListing();
    }, [id]); // Critical: id dependency ensures fresh load on navigation

    const handleAuthAction = (action) => {
        if (!user) {
            setConfirmDialog({
                isOpen: true,
                title: 'Giriş Yapmalısınız',
                message: 'Bu işlem için giriş yapmalısınız.',
                type: 'info',
                showCancel: false,
                confirmText: 'Giriş Yap',
                onConfirm: () => {
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                    navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
                },
                onCancel: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
            });
            return false;
        }
        return true;
    };

    const handleFavoriteToggle = async () => {
        if (!handleAuthAction()) return;

        setFavoriteError(null);
        const result = await toggleFavorite(parseInt(id));
        if (!result.success) {
            setFavoriteError(result.error);
            setTimeout(() => setFavoriteError(null), 3000);
        }
    };

    const handleStartConversation = async () => {
        if (!handleAuthAction()) return;

        setMessagingLoading(true);
        setMessagingError(null);

        try {
            const conversation = await createConversation(parseInt(id));
            navigate(`/messages?conversation=${conversation.id}`);
        } catch (err) {
            setMessagingError(err.response?.data?.detail || 'Konuşma başlatılamadı. Lütfen tekrar deneyin.');
            setTimeout(() => setMessagingError(null), 5000);
        } finally {
            setMessagingLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="detail-container">
                <div className="detail-header">
                    <button onClick={() => navigate('/')} className="back-btn">← İlanlara Dön</button>
                    <div className="header-actions">
                        <button onClick={() => navigate('/favorites')} className="favorites-link-btn">Favorilerim</button>
                        <button onClick={logout} className="logout-btn">Çıkış</button>
                    </div>
                </div>
                <div className="loading">İlan yükleniyor...</div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="detail-container">
                <div className="detail-header">
                    <button onClick={() => navigate('/')} className="back-btn">← İlanlara Dön</button>
                    <div className="header-actions">
                        <button onClick={() => navigate('/favorites')} className="favorites-link-btn">Favorilerim</button>
                        <button onClick={logout} className="logout-btn">Çıkış</button>
                    </div>
                </div>
                <div className="not-found">
                    <h2>İlan Bulunamadı</h2>
                    <p>Aradığınız ilan bulunamadı veya kaldırılmış.</p>
                    <button onClick={() => navigate('/')}>İlanlara Dön</button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="detail-container">
                <div className="detail-header">
                    <button onClick={() => navigate('/')} className="back-btn">← İlanlara Dön</button>
                    <div className="header-actions">
                        <button onClick={() => navigate('/favorites')} className="favorites-link-btn">Favorilerim</button>
                        <button onClick={logout} className="logout-btn">Çıkış</button>
                    </div>
                </div>
                <div className="error-container">
                    <p className="error">{error}</p>
                    <button onClick={loadListing}>Tekrar Dene</button>
                </div>
            </div>
        );
    }

    const favorited = isFavorited(parseInt(id));
    const isTogglingFavorite = toggleLoading[id];

    const handleDelete = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'İlanı Sil',
            message: 'Bu ilanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
            type: 'danger',
            confirmText: 'Sil',
            showCancel: true,
            onConfirm: async () => {
                setConfirmDialog({ ...confirmDialog, isOpen: false });
                try {
                    setLoading(true);
                    await deleteListing(id);
                    navigate('/');
                } catch (err) {
                    console.error('Delete failed:', err);
                    setConfirmDialog({
                        isOpen: true,
                        title: 'Hata',
                        message: 'İlan silinemedi: ' + (err.response?.data?.detail || 'Bilinmeyen hata'),
                        type: 'danger',
                        showCancel: false,
                        confirmText: 'Tamam',
                        onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false }),
                        onCancel: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
                    });
                    setLoading(false);
                }
            },
            onCancel: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
        });
    };

    return (
        <div className="detail-container">
            <div className="detail-header">
                <button onClick={() => navigate('/')} className="back-btn">← İlanlara Dön</button>
                <div className="header-actions">
                    <button onClick={() => navigate('/favorites')} className="favorites-link-btn">Favorilerim</button>
                    <button onClick={logout} className="logout-btn">Çıkış</button>
                </div>
            </div>

            <div className="detail-content">
                <div className="detail-gallery">
                    <div className="main-image">
                        {selectedImage ? (
                            <img src={selectedImage.image_url} alt={`${listing.animal_type} ${listing.title || listing.breed}`} />
                        ) : (
                            <div className="image-placeholder-large">Resim Yok</div>
                        )}
                    </div>

                    {images.length > 1 && (
                        <div className="thumbnails">
                            {images.map((image, index) => (
                                <div
                                    key={index}
                                    className={`thumbnail ${selectedImage?.image_url === image.image_url ? 'active' : ''}`}
                                    onClick={() => setSelectedImage(image)}
                                >
                                    <img src={image.image_url} alt={`Thumbnail ${index + 1}`} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="detail-info">
                    <div className="title-actions">
                        <h1>{listing.title || listing.breed || 'İsimsiz İlan'}</h1>
                        <div className="action-buttons">
                            {/* Check if current user is the owner */}
                            {user && user.id === listing.seller ? (
                                /* Owner view: Show Edit button and view count */
                                <>
                                    <button
                                        className="edit-btn"
                                        onClick={() => navigate(`/seller/listings/${id}/edit`)}
                                        title="İlanı düzenle"
                                    >
                                        <Edit3 size={16} style={{ marginRight: '0.5rem' }} />
                                        Düzenle
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={handleDelete}
                                        title="İlanı sil"
                                        style={{ backgroundColor: '#ff4d4f', color: 'white', border: 'none', marginLeft: '8px' }}
                                    >
                                        <Trash2 size={16} style={{ marginRight: '0.5rem' }} />
                                        Sil
                                    </button>
                                    <div className="view-count">
                                        <Eye size={16} style={{ marginRight: '0.5rem' }} />
                                        {listing.view_count || 0} görüntülenme
                                    </div>
                                </>
                            ) : (
                                /* Non-owner view: Show Favorite and Message buttons */
                                <>
                                    <button
                                        className={`favorite-btn-large ${favorited ? 'favorited' : ''}`}
                                        onClick={handleFavoriteToggle}
                                        disabled={isTogglingFavorite}
                                        title={favorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                                    >
                                        {favorited ? '★ Favorilerde' : '☆ Favorilere Ekle'}
                                    </button>
                                    <button
                                        className="messaging-btn"
                                        onClick={handleStartConversation}
                                        disabled={messagingLoading}
                                        title="Satıcı ile mesajlaş"
                                    >
                                        {messagingLoading ? 'Yükleniyor...' : (
                                            <>
                                                <MessageCircle size={16} style={{ marginRight: '0.5rem' }} />
                                                Mesajlaş
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {favoriteError && (
                        <div className="inline-error">{favoriteError}</div>
                    )}
                    {messagingError && (
                        <div className="inline-error">{messagingError}</div>
                    )}

                    <div className="info-grid">
                        <div className="info-item">
                            <span className="label">Fiyat</span>
                            <span className="value price">₺{listing.price}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Konum</span>
                            <span className="value">{listing.location}</span>
                        </div>
                        {listing.age && (
                            <div className="info-item">
                                <span className="label">Yaş</span>
                                <span className="value">{listing.age} yaşında</span>
                            </div>
                        )}
                        {listing.weight && (
                            <div className="info-item">
                                <span className="label">Ağırlık</span>
                                <span className="value">{listing.weight} kg</span>
                            </div>
                        )}
                        {/* Only show seller info if not the owner */}
                        {(!user || user.id !== listing.seller) && (
                            <div className="info-item">
                                <span className="label">Satıcı</span>
                                <span className="value seller">{listing.seller_username || listing.seller_email}</span>
                            </div>
                        )}
                        <div className="info-item">
                            <span className="label">Eklenme Tarihi</span>
                            <span className="value">{new Date(listing.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {listing.description && (
                        <div className="description-section">
                            <h3>Açıklama</h3>
                            <p>{listing.description}</p>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
                confirmText={confirmDialog.confirmText}
                cancelText={confirmDialog.cancelText}
                showCancel={confirmDialog.showCancel}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            />
        </div >
    );
};

export default AnimalDetail;
