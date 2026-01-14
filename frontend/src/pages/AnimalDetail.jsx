import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { fetchAnimal, fetchAnimalImages } from '../api/animals';
import './AnimalDetail.css';

const AnimalDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [listing, setListing] = useState(null);
    const [images, setImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notFound, setNotFound] = useState(false);

    const loadListing = async () => {
        setLoading(true);
        setError(null);
        setNotFound(false);

        try {
            const [listingData, imagesData] = await Promise.all([
                fetchAnimal(id),
                fetchAnimalImages(id).catch(() => []) // Don't fail on image errors
            ]);

            setListing(listingData);
            setImages(imagesData);

            // Set primary image or first image
            const primary = imagesData.find(img => img.is_primary);
            setSelectedImage(primary || imagesData[0] || null);
        } catch (err) {
            if (err.response?.status === 404) {
                setNotFound(true);
            } else {
                setError(err.response?.data?.detail || 'Failed to load listing');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadListing();
    }, [id]);

    if (loading) {
        return (
            <div className="detail-container">
                <div className="detail-header">
                    <button onClick={() => navigate('/')} className="back-btn">← Back to Listings</button>
                    <button onClick={logout} className="logout-btn">Logout</button>
                </div>
                <div className="loading">Loading listing...</div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="detail-container">
                <div className="detail-header">
                    <button onClick={() => navigate('/')} className="back-btn">← Back to Listings</button>
                    <button onClick={logout} className="logout-btn">Logout</button>
                </div>
                <div className="not-found">
                    <h2>Listing Not Found</h2>
                    <p>The listing you're looking for doesn't exist or has been removed.</p>
                    <button onClick={() => navigate('/')}>Back to Listings</button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="detail-container">
                <div className="detail-header">
                    <button onClick={() => navigate('/')} className="back-btn">← Back to Listings</button>
                    <button onClick={logout} className="logout-btn">Logout</button>
                </div>
                <div className="error-container">
                    <p className="error">{error}</p>
                    <button onClick={loadListing}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="detail-container">
            <div className="detail-header">
                <button onClick={() => navigate('/')} className="back-btn">← Back to Listings</button>
                <button onClick={logout} className="logout-btn">Logout</button>
            </div>

            <div className="detail-content">
                <div className="detail-gallery">
                    <div className="main-image">
                        {selectedImage ? (
                            <img src={selectedImage.image_url} alt={`${listing.animal_type} ${listing.breed}`} />
                        ) : (
                            <div className="image-placeholder-large">No Image Available</div>
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
                    <h1>{listing.animal_type} - {listing.breed}</h1>

                    <div className="info-grid">
                        <div className="info-item">
                            <span className="label">Price</span>
                            <span className="value price">${listing.price}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Location</span>
                            <span className="value">{listing.location}</span>
                        </div>
                        {listing.age && (
                            <div className="info-item">
                                <span className="label">Age</span>
                                <span className="value">{listing.age} years</span>
                            </div>
                        )}
                        {listing.weight && (
                            <div className="info-item">
                                <span className="label">Weight</span>
                                <span className="value">{listing.weight} kg</span>
                            </div>
                        )}
                        <div className="info-item">
                            <span className="label">Seller</span>
                            <span className="value seller">{listing.seller_email}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Listed</span>
                            <span className="value">{new Date(listing.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {listing.description && (
                        <div className="description-section">
                            <h3>Description</h3>
                            <p>{listing.description}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnimalDetail;
