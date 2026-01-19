import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createListing, uploadListingImages } from '../../api/sellers';
import { cities, getDistrictsForCity } from '../../data/locations';
import './Seller.css';

const NewListing = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        animal_type: 'SMALL',
        title: '',
        breed: '',
        gender: '',
        age: '',
        weight: '',
        price: '',
        city: '',
        district: '',
        description: ''
    });
    const [selectedImages, setSelectedImages] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState([]);

    // Cleanup object URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            selectedImages.forEach(img => {
                if (img.preview) URL.revokeObjectURL(img.preview);
            });
        };
    }, [selectedImages]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'city') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                district: '' // Reset district when city changes
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        // Create objects with preview URLs
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
        if (!formData.animal_type) newErrors.animal_type = 'Hayvan grubu gereklidir';
        if (!formData.age) newErrors.age = 'Yaş gereklidir';
        if (!formData.weight) newErrors.weight = 'Ağırlık gereklidir';
        if (!formData.price) newErrors.price = 'Fiyat gereklidir';
        if (!formData.city) newErrors.city = 'Şehir gereklidir';
        if (!formData.district) newErrors.district = 'İlçe gereklidir';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);
        setErrors({});

        try {
            // Create listing
            const listingData = {
                title: formData.title,
                animal_type: formData.animal_type,
                breed: formData.breed,
                price: parseFloat(formData.price),
                city: formData.city,
                district: formData.district,
            };

            if (formData.age && formData.age !== '') listingData.age_months = parseInt(formData.age); // Map 'age' to 'age_months'
            if (formData.weight && formData.weight !== '') listingData.weight = parseFloat(formData.weight);
            if (formData.description && formData.description !== '') listingData.description = formData.description;

            const newListing = await createListing(listingData);

            // Upload images if any
            if (selectedImages.length > 0) {
                setUploadStatus([{ message: 'Resimler yükleniyor...' }]);

                const filesToUpload = selectedImages.map(item => item.file);
                const results = await uploadListingImages(newListing.id, filesToUpload);

                setUploadStatus(results);

                // Wait a moment to show upload results
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            navigate('/seller/listings');
        } catch (err) {
            console.error('Create listing failed:', err);
            if (err.response?.data) {
                const backendErrors = err.response.data;
                const newErrors = {};

                if (Array.isArray(backendErrors)) {
                    // Handle list errors (e.g. ["Internal Error..."])
                    newErrors.general = backendErrors.join(', ');
                } else if (backendErrors.detail) {
                    // Handle specific detail (e.g. { detail: "..." })
                    newErrors.general = backendErrors.detail;
                } else {
                    // Handle field errors object
                    Object.keys(backendErrors).forEach(key => {
                        newErrors[key] = Array.isArray(backendErrors[key])
                            ? backendErrors[key][0]
                            : backendErrors[key];
                    });
                }
                setErrors(newErrors);
            } else {
                setErrors({ general: 'İlan oluşturulamadı' });
            }
        } finally {
            setLoading(false);
        }
    };

    const districts = formData.city ? getDistrictsForCity('TR', formData.city) : [];

    return (
        <div className="seller-container">
            <div className="seller-header">
                <h1>Yeni İlan</h1>
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
                                    <option value="KUCUKBAS">Küçükbaş</option>
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
                                    placeholder="örn: Satılık Kurbanlık Koç"
                                    required
                                />
                                {errors.title && <span className="error-text">{errors.title}</span>}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="age">Yaş (ay) *</label>
                                    <input
                                        type="number"
                                        id="age"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        min="0"
                                        required
                                    />
                                    {errors.age && <span className="error-text">{errors.age}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="weight">Ağırlık (kg) *</label>
                                    <input
                                        type="number"
                                        id="weight"
                                        name="weight"
                                        value={formData.weight}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        required
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

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="city">Şehir *</label>
                                    <select
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Seçiniz</option>
                                        {cities.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                    {errors.city && <span className="error-text">{errors.city}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="district">İlçe *</label>
                                    <select
                                        id="district"
                                        name="district"
                                        value={formData.district}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.city}
                                    >
                                        <option value="">Seçiniz</option>
                                        {districts.map(dist => (
                                            <option key={dist} value={dist}>{dist}</option>
                                        ))}
                                    </select>
                                    {errors.district && <span className="error-text">{errors.district}</span>}
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Açıklama</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    placeholder="İlan detayları..."
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="images">Resimler (En fazla 5)</label>
                                <input
                                    type="file"
                                    id="images"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                />
                                {selectedImages.length > 0 && (
                                    <div className="image-preview">
                                        <p>{selectedImages.length} resim seçildi (Maks: 5)</p>
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

                            {uploadStatus.length > 0 && (
                                <div className="upload-status">
                                    {uploadStatus.map((status, idx) => (
                                        <div key={idx} className={status.success ? 'success' : 'error'}>
                                            {status.message || status.file}: {status.success ? '✓' : status.error}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {errors.general && <div className="error-message">{errors.general}</div>}

                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Oluşturuluyor...' : 'İlan Oluştur'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewListing;
