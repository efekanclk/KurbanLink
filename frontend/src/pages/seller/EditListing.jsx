import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchListingDetails, updateListing } from '../../api/sellers';
import { uploadListingImages } from '../../api/sellers';
import { fetchAnimalImages, deleteAnimalImage, reorderAnimalImages } from '../../api/animals';
import ImageManager from '../../components/ImageManager';
import PriceInput from '../../components/PriceInput';
import './Seller.css';

const EditListing = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        animal_type: 'SMALL',
        title: '',
        breed: '',
        gender: '',
        age: '',
        weight: '',
        price: '',
        location: '',
        description: ''
    });
    const [images, setImages] = useState([]);  // Unified array: existing + new
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            images.forEach(img => {
                if (img.kind === 'local' && img.url) {
                    URL.revokeObjectURL(img.url);
                }
            });
        };
    }, [images]);

    useEffect(() => {
        const loadListing = async () => {
            try {
                const listing = await fetchListingDetails(id);
                setFormData({
                    animal_type: listing.animal_type || 'SMALL',
                    title: listing.title || listing.breed || '',
                    breed: listing.breed || '',
                    gender: listing.gender || '',
                    age: listing.age || '',
                    weight: listing.weight || '',
                    price: listing.price || '',
                    location: listing.location || '',
                    description: listing.description || ''
                });

                // Load existing images
                const serverImages = await fetchAnimalImages(id);
                const transformedImages = (serverImages || []).map((img, idx) => ({
                    kind: 'server',
                    id: img.id,
                    url: img.image_url,
                    order: img.order !== undefined ? img.order : idx
                }));
                setImages(transformedImages);
            } catch (err) {
                console.error('Failed to load listing:', err);
                alert('İlan yüklenemedi');
                navigate('/seller/listings');
            } finally {
                setLoading(false);
            }
        };

        loadListing();
    }, [id, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleDeleteServerImage = async (imageId) => {
        try {
            await deleteAnimalImage(imageId);
        } catch (err) {
            console.error('Failed to delete image:', err);
            alert('Resim silinemedi. Lütfen tekrar deneyin.');
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'İlan başlığı gereklidir';
        if (!formData.price) newErrors.price = 'Fiyat gereklidir';
        if (formData.price && isNaN(formData.price)) newErrors.price = 'Geçerli bir fiyat girin';
        if (!formData.location.trim()) newErrors.location = 'Konum gereklidir';
        if (formData.age && isNaN(formData.age)) newErrors.age = 'Geçerli bir yaş girin';
        if (formData.weight && isNaN(formData.weight)) newErrors.weight = 'Geçerli bir ağırlık girin';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setSubmitting(true);
        setErrors({});

        try {
            const listingData = {
                animal_type: formData.animal_type,
                title: formData.title,
                breed: formData.breed,
                price: parseFloat(formData.price),
                location: formData.location,
            };

            if (formData.age && formData.age !== '') listingData.age_months = parseInt(formData.age);
            if (formData.weight && formData.weight !== '') listingData.weight = parseFloat(formData.weight);
            if (formData.description && formData.description !== '') listingData.description = formData.description;

            await updateListing(id, listingData);

            // Upload new local images
            const localImages = images.filter(img => img.kind === 'local');
            if (localImages.length > 0) {
                const filesToUpload = localImages.map(img => img.file);
                await uploadListingImages(id, filesToUpload);
            }

            // Refresh images to get IDs for newly uploaded ones
            const updatedImages = await fetchAnimalImages(id);

            // Create order mapping for all images
            const orders = updatedImages.map((img, idx) => ({
                id: img.id,
                order: idx
            }));

            // Send reorder request
            await reorderAnimalImages(id, orders);

            navigate('/seller/listings');
        } catch (err) {
            console.error('Update listing failed:', err);
            if (err.response?.data) {
                const backendErrors = err.response.data;
                const newErrors = {};
                Object.keys(backendErrors).forEach(key => {
                    newErrors[key] = Array.isArray(backendErrors[key])
                        ? backendErrors[key][0]
                        : backendErrors[key];
                });
                setErrors(newErrors);
            } else {
                setErrors({ general: 'İlan güncellenemedi' });
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="seller-container">
                <div className="seller-header">
                    <h1>İlan Düzenle</h1>
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
                <h1>İlan Düzenle</h1>
                <div className="header-actions">
                    <button onClick={() => navigate('/seller/listings')} className="back-btn">
                        ← Geri
                    </button>
                </div>
            </div>

            <div className="page">
                <div className="page__container">
                    <div className="form-card">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="animal_type">Hayvan Grubu *</label>
                                <select
                                    id="animal_type"
                                    name="animal_type"
                                    value={formData.animal_type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="SMALL">Küçükbaş</option>
                                    <option value="BUYUKBAS">Büyükbaş</option>
                                </select>
                            </div>



                            <div className="form-group">
                                <label htmlFor="title">İlan Başlığı *</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.title && <span className="error-text">{errors.title}</span>}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="breed">Irk</label>
                                    <input
                                        type="text"
                                        id="breed"
                                        name="breed"
                                        value={formData.breed}
                                        onChange={handleChange}
                                        placeholder="örn: Merinos, Kıvırcık"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="gender">Cinsiyet</label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                    >
                                        <option value="">Seçiniz</option>
                                        <option value="ERKEK">Erkek</option>
                                        <option value="DISI">Dişi</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="age">Yaş (ay)</label>
                                    <input
                                        type="number"
                                        id="age"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        min="0"
                                    />
                                    {errors.age && <span className="error-text">{errors.age}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="price">Fiyat</label>
                                    <PriceInput
                                        value={formData.price}
                                        onChange={handleChange}
                                        error={errors.price}
                                    />
                                    {errors.price && <span className="error-text">{errors.price}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="weight">Ağırlık (kg)</label>
                                    <input
                                        type="number"
                                        id="weight"
                                        name="weight"
                                        value={formData.weight}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                    />
                                    {errors.weight && <span className="error-text">{errors.weight}</span>}
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="location">Konum *</label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.location && <span className="error-text">{errors.location}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Açıklama</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                />
                            </div>

                            {/* Unified Images Section */}
                            <div className="form-group">
                                <label className="form-label">Resimler (En fazla 20)</label>
                                <ImageManager
                                    images={images}
                                    onChange={setImages}
                                    onDeleteServer={handleDeleteServerImage}
                                    maxImages={20}
                                />
                            </div>

                            {errors.general && <div className="error-message">{errors.general}</div>}

                            <button type="submit" className="submit-btn" disabled={submitting}>
                                {submitting ? 'Güncelleniyor...' : 'Güncelle'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditListing;
