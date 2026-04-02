import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { fetchMyListings, deleteListing, permanentlyDeleteListing } from '../../api/sellers';
import { getUserIdFromToken } from '../../utils/jwt';
import { ClipboardList, Trash2, Plus, ArrowLeft, LogOut, MapPin, Tag, CheckCircle2, Image as ImageIcon } from '../../ui/icons';
import './Seller.css';

const SellerListings = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('active'); // 'active' or 'deleted'

    const loadListings = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('access_token');
            const userId = getUserIdFromToken(token);

            const options = { mine: true };
            if (viewMode === 'deleted') {
                options.deleted = true;
            }

            const data = await fetchMyListings(userId, options);
            setListings(data.results || data);
        } catch (err) {
            console.error('Failed to load listings:', err);
            setError('İlanlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadListings();
    }, [viewMode]);

    const formatPrice = (price) => {
        const num = parseFloat(price);
        return num.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu ilanı silmek istediğinize emin misiniz?')) {
            return;
        }

        try {
            await deleteListing(id);
            await loadListings();
        } catch (err) {
            console.error('Delete failed:', err);
            alert('İlan silinemedi: ' + (err.response?.data?.detail || 'Bilinmeyen hata'));
        }
    };

    const handlePermanentDelete = async (id) => {
        if (!window.confirm('Bu ilanı KALICI olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm fotoğraflar silinir.')) {
            return;
        }

        try {
            await permanentlyDeleteListing(id);
            await loadListings();
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Silme işlemi başarısız: ' + (err.response?.data?.detail || 'Bilinmeyen hata'));
        }
    };

    if (loading && listings.length === 0) {
        return (
            <div className="seller-container">
                <div className="seller-header">
                    <h1>İlanlarım</h1>
                    <div className="header-actions">
                        <button onClick={() => navigate('/')} className="back-btn">
                            <ArrowLeft size={18} /> Geri
                        </button>
                    </div>
                </div>
                <div className="page">
                    <div className="page__container">
                        <div className="loading">Yükleniyor...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="seller-container">
            <div className="seller-header">
                <h1>İlanlarım</h1>
                <div className="header-actions">
                    <button onClick={() => navigate('/seller/listings/new')} className="create-btn">
                        <Plus size={18} /> Yeni İlan
                    </button>
                    <button onClick={() => navigate('/')} className="back-btn">
                        <ArrowLeft size={18} /> Geri
                    </button>
                    <button onClick={logout} className="logout-btn">
                        <LogOut size={18} /> Çıkış
                    </button>
                </div>
            </div>

            <div className="page seller-page-layout">
                {/* Sidebar */}
                <div className="seller-sidebar">
                    <button
                        className={`sidebar-item ${viewMode === 'active' ? 'active' : ''}`}
                        onClick={() => setViewMode('active')}
                    >
                        <ClipboardList size={18} style={{ marginRight: '0.75rem' }} />
                        Aktif İlanlar
                    </button>
                    <button
                        className={`sidebar-item ${viewMode === 'deleted' ? 'active' : ''}`}
                        onClick={() => setViewMode('deleted')}
                    >
                        <Trash2 size={18} style={{ marginRight: '0.75rem' }} />
                        Silinen İlanlar
                    </button>
                </div>

                {/* Main Content */}
                <div className="seller-content">
                    {listings.length === 0 ? (
                        <div className="form-card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p className="empty-message">
                                {viewMode === 'active' ? 'Henüz aktif ilanınız yok.' : 'Silinen ilanınız bulunmuyor.'}
                            </p>
                            {viewMode === 'active' && (
                                <button
                                    onClick={() => navigate('/seller/listings/new')}
                                    className="create-btn"
                                    style={{ margin: '0 auto' }}
                                >
                                    <Plus size={18} /> İlk İlanınızı Oluşturun
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="listings-grid">
                            {listings.map(listing => (
                                <div key={listing.id} className={`listing-card ${viewMode === 'deleted' ? 'deleted-card' : ''}`}>
                                    <div className="listing-image" onClick={() => viewMode === 'active' && navigate(`/animals/${listing.id}`)}>
                                        {listing.primary_image_url ? (
                                            <img src={listing.primary_image_url} alt={listing.title} />
                                        ) : (
                                            <div className="no-image-placeholder">
                                                <ImageIcon size={32} />
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className="listing-info"
                                        onClick={() => viewMode === 'active' && navigate(`/animals/${listing.id}`)}
                                        style={{ cursor: viewMode === 'active' ? 'pointer' : 'default' }}
                                    >
                                        <span className="type-badge">
                                            {listing.animal_type === 'SMALL' ? 'Küçükbaş' : 'Büyükbaş'}
                                        </span>
                                        <h3>{listing.title || 'İsimsiz İlan'}</h3>
                                        <div className="details">
                                            <p><strong><Tag size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Tür:</strong> {listing.breed}</p>
                                            <p><strong><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Konum:</strong> {listing.location || `${listing.city}, ${listing.district}`}</p>
                                        </div>
                                        <div className="listing-price">
                                            {formatPrice(listing.price)} TL
                                        </div>
                                        <div className="status">
                                            {listing.is_active ? (
                                                <span className="active"><CheckCircle2 size={14} /> Yayında</span>
                                            ) : (
                                                <span className="inactive"><Trash2 size={14} /> Silindi</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="listing-actions">
                                        {viewMode === 'active' ? (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/seller/listings/${listing.id}/edit`);
                                                    }}
                                                    className="edit-btn"
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(listing.id);
                                                    }}
                                                    className="delete-btn"
                                                >
                                                    Sil
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePermanentDelete(listing.id);
                                                }}
                                                className="delete-btn permanent-delete-btn"
                                            >
                                                Kalıcı Olarak Sil
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SellerListings;
