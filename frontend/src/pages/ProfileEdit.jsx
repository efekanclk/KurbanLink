import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { cities, getDistrictsForCity } from '../data/locations';
import axios from 'axios';
import './ProfileEdit.css';

const ProfileEdit = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        phone_number: '',
        country_code: 'TR',
        city: '',
        district: '',
        profile_image: null
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                phone_number: user.phone_number || '',
                country_code: user.country_code || 'TR',
                city: user.city || '',
                district: user.district || '',
                profile_image: null
            });
            if (user.profile_image_url) {
                setPreviewImage(user.profile_image_url);
            }
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // Clear district if city changes
            ...(name === 'city' && { district: '' })
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Dosya boyutu 5MB\'dan küçük olmalıdır.');
                return;
            }

            setFormData(prev => ({ ...prev, profile_image: file }));

            // Preview
            const reader = new FileReader();
            reader.onloadend = () => setPreviewImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const formDataToSend = new FormData();

            // Add text fields
            formDataToSend.append('username', formData.username);
            formDataToSend.append('phone_number', formData.phone_number);
            formDataToSend.append('country_code', formData.country_code);
            formDataToSend.append('city', formData.city);
            formDataToSend.append('district', formData.district);

            // Add image if selected
            if (formData.profile_image) {
                formDataToSend.append('profile_image', formData.profile_image);
            }

            const token = localStorage.getItem('access_token');
            const response = await axios.patch(
                'http://localhost:8000/api/auth/me/',
                formDataToSend,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setSuccess(true);

            // Redirect after success
            setTimeout(() => {
                navigate('/profile');
            }, 1500);

        } catch (err) {
            setError(err.response?.data?.detail || 'Profil güncellenemedi. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/profile');
    };

    const availableDistricts = formData.city ? getDistrictsForCity('TR', formData.city) : [];

    return (
        <div className="profile-edit-page">
            <div className="profile-edit-container">
                <div className="edit-header">
                    <h1>Profili Düzenle</h1>
                    <button onClick={handleCancel} className="back-btn">← Geri</button>
                </div>

                <form onSubmit={handleSubmit} className="edit-form">
                    {/* Profile Image */}
                    <div className="form-section">
                        <label className="section-label">Profil Fotoğrafı</label>
                        <div className="image-upload-container">
                            <div className="image-preview">
                                {previewImage ? (
                                    <img src={previewImage} alt="Profil" />
                                ) : (
                                    <div className="image-placeholder">
                                        {formData.username?.charAt(0)?.toUpperCase() || '👤'}
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                id="profile_image"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="file-input"
                            />
                            <label htmlFor="profile_image" className="file-label">
                                Fotoğraf Seç
                            </label>
                            <span className="file-hint">Max 5MB</span>
                        </div>
                    </div>

                    {/* Username */}
                    <div className="form-group">
                        <label htmlFor="username">Kullanıcı Adı</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div className="form-group">
                        <label htmlFor="phone_number">Telefon Numarası</label>
                        <input
                            type="tel"
                            id="phone_number"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Country Code */}
                    <div className="form-group">
                        <label htmlFor="country_code">Ülke</label>
                        <select
                            id="country_code"
                            name="country_code"
                            value={formData.country_code}
                            onChange={handleChange}
                        >
                            <option value="TR">Türkiye</option>
                            <option value="DE">Almanya</option>
                        </select>
                    </div>

                    {/* City */}
                    <div className="form-group">
                        <label htmlFor="city">Şehir *</label>
                        <select
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Şehir seçin</option>
                            {cities.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>

                    {/* District */}
                    {availableDistricts.length > 0 && (
                        <div className="form-group">
                            <label htmlFor="district">İlçe</label>
                            <select
                                id="district"
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                            >
                                <option value="">İlçe seçin (opsiyonel)</option>
                                {availableDistricts.map(district => (
                                    <option key={district} value={district}>{district}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Error/Success Messages */}
                    {error && <div className="form-error">{error}</div>}
                    {success && <div className="form-success">✓ Profil güncellendi!</div>}

                    {/* Actions */}
                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="btn-cancel"
                            disabled={loading}
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="btn-save"
                            disabled={loading}
                        >
                            {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileEdit;
