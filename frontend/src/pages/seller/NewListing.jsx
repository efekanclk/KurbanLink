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
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

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

        const updatedImages = [...selectedImages, ...newImages].slice(0, 20);

        if (updatedImages.length > 20) {
            alert('En fazla 20 resim yükleyebilirsiniz');
            return;
        }
        setSelectedImages(updatedImages);
        e.target.value = '';
    };

    const handleRemoveImage = (index) => {
        setSelectedImages(prev => {
            const newImages = [...prev];
            if (newImages[index].preview) {
                URL.revokeObjectURL(newImages[index].preview);
            }
            newImages.splice(index, 1);
            return newImages;
        });
    };

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Ghost image usually handled by browser, but we can set it if needed
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) return;

        const newImages = [...selectedImages];
        const draggedItem = newImages[draggedIndex];

        // Remove dragged item
        newImages.splice(draggedIndex, 1);
        // Insert at new position
        newImages.splice(targetIndex, 0, draggedItem);

        setSelectedImages(newImages);
        setDraggedIndex(null);
    };

    // File drop handlers (for dropping files from desktop)
    const handleFileDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);

        // If dragging an existing image (reordering), don't process as file drop
        if (draggedIndex !== null) {
            return;
        }

        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));

        if (files.length === 0) return;

        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        const updatedImages = [...selectedImages, ...newImages].slice(0, 20);

        if (selectedImages.length + files.length > 20) {
            alert('En fazla 20 resim yükleyebilirsiniz');
        }

        setSelectedImages(updatedImages);
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only show drag-over state if dragging files from desktop
        if (draggedIndex === null) {
            setIsDraggingOver(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set to false if leaving the drop zone itself
        if (e.currentTarget === e.target) {
            setIsDraggingOver(false);
        }
    };

    const handleDragOverDropZone = (e) => {
        e.preventDefault();
        e.stopPropagation();
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
        setUploadStatus([]);

        try {
            // 1. Create listing with clean payload
            const listingData = {
                title: formData.title,
                animal_type: formData.animal_type,
                breed: formData.breed || '',
                gender: formData.gender || null,
                price: parseFloat(formData.price), // Ensure number
                city: formData.city,
                district: formData.district,
                description: formData.description || '',
                age_months: parseInt(formData.age, 10), // Ensure integer
                weight: parseFloat(formData.weight) // Ensure number
            };

            const newListing = await createListing(listingData);

            // 2. Upload images if any
            if (selectedImages.length > 0) {
                setUploadStatus([{ message: 'Resimler yükleniyor...', success: true }]);

                // Prepare images with is_primary flag (first one is primary)
                const imagesToUpload = selectedImages.map((item, index) => ({
                    file: item.file,
                    is_primary: index === 0
                }));

                const results = await uploadListingImages(newListing.id, imagesToUpload);
                setUploadStatus(results);

                // Check if any failed
                const failed = results.filter(r => !r.success);

                if (failed.length > 0) {
                    setErrors({ general: `${failed.length} resim yüklenemedi. İlanınız oluşturuldu, düzenleme sayfasından tekrar deneyebilirsiniz.` });
                    // Provide a link or way to proceed? For now, just show error.
                    // If some succeeded, we still proceed after a delay?
                }

                // Wait a moment to show success/status before redirecting
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            navigate('/seller/listings');
        } catch (err) {
            console.error('Create listing failed:', err);
            if (err.response?.data) {
                const backendErrors = err.response.data;
                const newErrors = {};

                if (Array.isArray(backendErrors)) {
                    newErrors.general = backendErrors.join(', ');
                } else if (backendErrors.detail) {
                    newErrors.general = backendErrors.detail;
                } else {
                    Object.keys(backendErrors).forEach(key => {
                        const val = backendErrors[key];
                        newErrors[key] = Array.isArray(val) ? val[0] : val;
                    });
                }
                setErrors(newErrors);

                // Scroll to top to see errors
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                setErrors({ general: 'Bir hata oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyin.' });
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
                                <label className="form-label">Resimler (En fazla 20)</label>

                                <div
                                    className={`image-uploader ${isDraggingOver ? 'drag-over' : ''}`}
                                    onDrop={handleFileDrop}
                                    onDragOver={handleDragOverDropZone}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                >
                                    <div className="image-uploader__input">
                                        <input
                                            type="file"
                                            id="images"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageChange}
                                            className="file-input"
                                        />
                                        <span className="image-uploader__hint">
                                            Ekle ya da sürükle
                                        </span>
                                    </div>

                                    {selectedImages.length > 0 && (
                                        <>
                                            <div className="image-uploader__info">
                                                <span>{selectedImages.length}/20 resim seçildi</span>
                                            </div>

                                            <div className="image-uploader__grid">
                                                {selectedImages.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`image-uploader__item ${idx === 0 ? 'is-primary' : ''} ${draggedIndex === idx ? 'dragging' : ''}`}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, idx)}
                                                        onDragOver={(e) => handleDragOver(e, idx)}
                                                        onDrop={(e) => handleDrop(e, idx)}
                                                    >
                                                        <img
                                                            src={item.preview}
                                                            alt={`Preview ${idx}`}
                                                            className="image-uploader__thumb"
                                                        />

                                                        {idx === 0 && (
                                                            <div className="image-uploader__badge">Ana Görsel</div>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveImage(idx)}
                                                            className="image-uploader__remove"
                                                            aria-label="Remove image"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
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
