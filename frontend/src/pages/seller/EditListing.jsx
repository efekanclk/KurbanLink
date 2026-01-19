import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchListingDetails, updateListing, uploadListingImages } from '../../api/sellers';
import './Seller.css';

const EditListing = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        animal_type: 'SMALL',
        title: '',
        breed: '',
        age: '',
        weight: '',
        price: '',
        location: '',
        description: ''
    });
    const [selectedImages, setSelectedImages] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            selectedImages.forEach(img => {
                if (img.preview) URL.revokeObjectURL(img.preview);
            });
        };
    }, [selectedImages]);

    useEffect(() => {
        const loadListing = async () => {
            try {
                const listing = await fetchListingDetails(id);
                setFormData({
                    animal_type: listing.animal_type || 'SMALL',
                    title: listing.title || listing.breed || '',
                    breed: listing.breed || '',
                    age: listing.age || '',
                    weight: listing.weight || '',
                    price: listing.price || '',
                    location: listing.location || '',
                    description: listing.description || ''
                });
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

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        const updatedImages = [...selectedImages, ...newImages].slice(0, 5);

        if (updatedImages.length > 5) {
            alert('En fazla 5 resim yükleyebilirsiniz');
            return;
        }
        setSelectedImages(updatedImages);
        e.target.value = '';
    };

    const handleRemoveImage = (index) => {
        setSelectedImages(prev => {
            const newImages = [...prev];
            URL.revokeObjectURL(newImages[index].preview);
            newImages.splice(index, 1);
            return newImages;
        });
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

            // Upload new images if any
            if (selectedImages.length > 0) {
                const filesToUpload = selectedImages.map(item => item.file);
                await uploadListingImages(id, filesToUpload);
            }

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
                                <label htmlFor="price">Fiyat (TL) *</label>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                                {errors.price && <span className="error-text">{errors.price}</span>}
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

                            <div className="form-group">
                                <label htmlFor="images">Yeni Resimler Ekle (Opsiyonel)</label>
                                <input
                                    type="file"
                                    id="images"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                />
                                {selectedImages.length > 0 && (
                                    <div className="image-preview">
                                        <p>{selectedImages.length} yeni resim seçildi (Maks: 5)</p>
                                        <div className="image-grid">
                                            {selectedImages.map((item, idx) => (
                                                <div key={idx} className="image-card">
                                                    <img src={item.preview} alt={`Preview ${idx}`} />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(idx)}
                                                        className="remove-image-btn"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
