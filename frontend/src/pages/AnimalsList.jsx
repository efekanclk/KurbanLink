import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { fetchAnimals, fetchAnimalImages } from '../api/animals';
import './AnimalsList.css';

const AnimalsList = () => {
    const { logout } = useAuth();
    const [listings, setListings] = useState([]);
    const [listingImages, setListingImages] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadListings = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await fetchAnimals();
            setListings(data);

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
        loadListings();
    }, []);

    if (loading) {
        return (
            <div className="animals-container">
                <div className="animals-header">
                    <h1>Animal Listings</h1>
                    <button onClick={logout} className="logout-btn">Logout</button>
                </div>
                <div className="loading">Loading listings...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="animals-container">
                <div className="animals-header">
                    <h1>Animal Listings</h1>
                    <button onClick={logout} className="logout-btn">Logout</button>
                </div>
                <div className="error-container">
                    <p className="error">{error}</p>
                    <button onClick={loadListings}>Retry</button>
                </div>
            </div>
        );
    }

    if (listings.length === 0) {
        return (
            <div className="animals-container">
                <div className="animals-header">
                    <h1>Animal Listings</h1>
                    <button onClick={logout} className="logout-btn">Logout</button>
                </div>
                <div className="empty-state">No listings found.</div>
            </div>
        );
    }

    return (
        <div className="animals-container">
            <div className="animals-header">
                <h1>Animal Listings</h1>
                <button onClick={logout} className="logout-btn">Logout</button>
            </div>

            <div className="animals-grid">
                {listings.map(listing => {
                    const image = listingImages[listing.id];

                    return (
                        <div key={listing.id} className="animal-card">
                            <div className="animal-image">
                                {image ? (
                                    <img src={image.image_url} alt={`${listing.animal_type} ${listing.breed}`} />
                                ) : (
                                    <div className="image-placeholder">No Image</div>
                                )}
                            </div>

                            <div className="animal-details">
                                <h3>{listing.animal_type} - {listing.breed}</h3>

                                <div className="animal-info">
                                    <div className="info-row">
                                        <span className="label">Price:</span>
                                        <span className="value">${listing.price}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Location:</span>
                                        <span className="value">{listing.location}</span>
                                    </div>
                                    {listing.age && (
                                        <div className="info-row">
                                            <span className="label">Age:</span>
                                            <span className="value">{listing.age} years</span>
                                        </div>
                                    )}
                                    {listing.weight && (
                                        <div className="info-row">
                                            <span className="label">Weight:</span>
                                            <span className="value">{listing.weight} kg</span>
                                        </div>
                                    )}
                                    <div className="info-row">
                                        <span className="label">Seller:</span>
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
