import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { cities, getDistrictsForCity } from '../data/locations';
import './Register.css';

const Register = () => {
    const navigate = useNavigate();
    const { register, loading } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        phone_number: '',
        country_code: 'TR',
        city: '',
        district: '',
        is_butcher: false,
        butcher_profile: {
            first_name: '',
            last_name: '',
            city: '', // Still kept for backward compatibility if needed, but main user city is primary
            district: '',
            services: '',
            price_range: ''
        }
    });

    const [errors, setErrors] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Handle checkbox
        if (type === 'checkbox' && name === 'is_butcher') {
            setFormData(prev => ({
                ...prev,
                is_butcher: checked
            }));
            return;
        }

        // Handle butcher profile fields
        if (name.startsWith('butcher_')) {
            const fieldName = name.replace('butcher_', '');
            setFormData(prev => ({
                ...prev,
                butcher_profile: {
                    ...prev.butcher_profile,
                    [fieldName]: value
                }
            }));
            return;
        }

        // Handle regular fields
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Special handling for main city change to reset district
        if (name === 'city') {
            setFormData(prev => ({
                ...prev,
                city: value,
                district: ''
            }));
        }

        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim()) {
            newErrors.email = 'E-posta gereklidir';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Geçerli bir e-posta girin';
        }
        if (!formData.username.trim()) {
            newErrors.username = 'Kullanıcı adı gereklidir';
        } else if (formData.username.length < 3 || formData.username.length > 30) {
            newErrors.username = 'Kullanıcı adı 3-30 karakter arasında olmalıdır';
        }
        if (!formData.phone_number.trim()) {
            newErrors.phone_number = 'Telefon numarası gereklidir';
        }
        if (!formData.city) {
            newErrors.city = 'Şehir seçimi zorunludur';
        }
        if (!formData.password) {
            newErrors.password = 'Şifre gereklidir';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Şifre en az 8 karakter olmalıdır';
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Şifreler eşleşmiyor';
        }

        // Validate butcher profile if is_butcher is checked
        if (formData.is_butcher) {
            if (!formData.butcher_profile.first_name.trim()) {
                newErrors.butcher_first_name = 'Ad gereklidir';
            }
            if (!formData.butcher_profile.last_name.trim()) {
                newErrors.butcher_last_name = 'Soyad gereklidir';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setFieldErrors({});

        if (!validateForm()) {
            return;
        }

        try {
            const payload = {
                email: formData.email,
                password: formData.password,
                username: formData.username,
                phone_number: formData.phone_number,
                country_code: formData.country_code,
                city: formData.city,
                district: formData.district,
                is_butcher: formData.is_butcher
            };

            // Add butcher profile if is_butcher is true
            if (formData.is_butcher) {
                payload.butcher_profile = {
                    first_name: formData.butcher_profile.first_name,
                    last_name: formData.butcher_profile.last_name,
                    // Use main city/district for butcher profile as well by default if not specified separately
                    // But here we just send what's in the profile object? 
                    // Let's assume user wants to use same location. 
                    // Actually, let's keep it simple: butcher fields specific to business.
                    // But we removed city/district from butcher form UI below, so we should map main city/district to butcher profile too?
                    // The backend RegisterView expects butcher_profile data.
                    // Let's copy main city/district to butcher profile if empty?
                    city: formData.city,
                    district: formData.district,
                    services: formData.butcher_profile.services
                        ? formData.butcher_profile.services.split(',').map(s => s.trim())
                        : [],
                    price_range: formData.butcher_profile.price_range || ''
                };
            }

            const result = await register(payload);

            if (result.success) {
                navigate('/');
            } else {
                if (result.errors) {
                    const backendErrors = result.errors;
                    const newFieldErrors = {};
                    let generalError = null;

                    Object.keys(backendErrors).forEach(key => {
                        const errorMsg = Array.isArray(backendErrors[key])
                            ? backendErrors[key][0]
                            : backendErrors[key];

                        // Map field errors
                        if (['email', 'username', 'phone_number', 'city', 'district', 'password', 'country_code'].includes(key)) {
                            newFieldErrors[key] = errorMsg;
                        }
                        // Map butcher profile errors
                        else if (key === 'butcher_profile') {
                            setErrors({ butcher_profile: errorMsg });
                        }
                        // Handle butcher specific fields flattened
                        else if (key.startsWith('butcher_')) {
                            // Backend might return butcher_profile nested errors?
                            // Or if we flatten them? 
                            // Let's just put them in general or try to map if we knew the field name
                            newFieldErrors[key] = errorMsg;
                        }
                        // Everything else is general
                        else {
                            generalError = errorMsg;
                        }
                    });

                    setFieldErrors(newFieldErrors);
                    if (generalError) {
                        setErrors(prev => ({ ...prev, general: generalError }));
                    } else if (Object.keys(newFieldErrors).length === 0) {
                        // Fallback if no specific fields matched but we have errors
                        setErrors({ general: 'Giriş bilgilerinizi kontrol ediniz.' });
                    }
                } else {
                    setErrors({ general: result.error || 'Kayıt başarısız oldu.' });
                }
            }
        } catch (error) {
            console.error('Register error:', error);
            setErrors({ general: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
        }
    };

    return (
        <div className="page">
            <div className="page__container">
                <div className="form-card">
                    <h1>Kayıt Ol</h1>
                    <p className="subtitle">KurbanLink'e hoş geldiniz!</p>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">E-posta</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={errors.email || fieldErrors.email ? 'error' : ''}
                            />
                            {(errors.email || fieldErrors.email) && (
                                <span className="error-text">{errors.email || fieldErrors.email}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="username">Kullanıcı Adı</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={errors.username || fieldErrors.username ? 'error' : ''}
                                placeholder="kullaniciadi (küçük harf, 3-30 karakter)"
                            />
                            {(errors.username || fieldErrors.username) && (
                                <span className="error-text">{errors.username || fieldErrors.username}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone_number">Telefon Numarası</label>
                            <div className="phone-input-group">
                                <select
                                    className="country-code-select"
                                    name="country_code"
                                    value={formData.country_code}
                                    onChange={handleChange}
                                >
                                    <option value="TR">🇹🇷 +90</option>
                                    <option value="DE">🇩🇪 +49</option>
                                    <option value="NL">🇳🇱 +31</option>
                                    <option value="FR">🇫🇷 +33</option>
                                    <option value="GB">🇬🇧 +44</option>
                                    <option value="US">🇺🇸 +1</option>
                                    <option value="IQ">🇮🇶 +964</option>
                                    <option value="SA">🇸🇦 +966</option>
                                </select>
                                <input
                                    type="tel"
                                    id="phone_number"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    className={errors.phone_number || fieldErrors.phone_number ? 'error' : ''}
                                    placeholder="555 123 4567"
                                />
                            </div>
                            {(errors.phone_number || fieldErrors.phone_number) && (
                                <span className="error-text">{errors.phone_number || fieldErrors.phone_number}</span>
                            )}
                        </div>

                        {/* City & District Dropdowns */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="city">Şehir *</label>
                                <select
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className={errors.city || fieldErrors.city ? 'error' : ''}
                                >
                                    <option value="">Seçiniz</option>
                                    {cities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                                {(errors.city || fieldErrors.city) && (
                                    <span className="error-text">{errors.city || fieldErrors.city}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="district">İlçe</label>
                                <select
                                    id="district"
                                    name="district"
                                    value={formData.district}
                                    onChange={handleChange}
                                    disabled={!formData.city}
                                >
                                    <option value="">Seçiniz</option>
                                    {formData.city && getDistrictsForCity(formData.country_code, formData.city).map(dist => (
                                        <option key={dist} value={dist}>{dist}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Şifre</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={errors.password || fieldErrors.password ? 'error' : ''}
                            />
                            {(errors.password || fieldErrors.password) && (
                                <span className="error-text">{errors.password || fieldErrors.password}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Şifre (Tekrar)</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={errors.confirmPassword ? 'error' : ''}
                            />
                            {errors.confirmPassword && (
                                <span className="error-text">{errors.confirmPassword}</span>
                            )}
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="is_butcher"
                                    checked={formData.is_butcher}
                                    onChange={handleChange}
                                />
                                <span>Kasap mısınız?</span>
                            </label>
                        </div>

                        {formData.is_butcher && (
                            <div className="butcher-fields">
                                <h3>Kasap Bilgileri</h3>
                                <p className="hint-text">İşletme adınız ve diğer detaylar</p>

                                <div className="form-group">
                                    <label htmlFor="butcher_first_name">Ad / İşletme Adı *</label>
                                    <input
                                        type="text"
                                        id="butcher_first_name"
                                        name="butcher_first_name"
                                        value={formData.butcher_profile.first_name}
                                        onChange={handleChange}
                                        className={errors.butcher_first_name ? 'error' : ''}
                                    />
                                    {errors.butcher_first_name && (
                                        <span className="error-text">{errors.butcher_first_name}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="butcher_last_name">Soyad *</label>
                                    <input
                                        type="text"
                                        id="butcher_last_name"
                                        name="butcher_last_name"
                                        value={formData.butcher_profile.last_name}
                                        onChange={handleChange}
                                        className={errors.butcher_last_name ? 'error' : ''}
                                    />
                                    {errors.butcher_last_name && (
                                        <span className="error-text">{errors.butcher_last_name}</span>
                                    )}
                                </div>

                                {/* Removed duplicate city/district from butcher section since we catch it globally now */}

                                <div className="form-group">
                                    <label htmlFor="butcher_services">Hizmetler (Opsiyonel, virgülle ayırın)</label>
                                    <input
                                        type="text"
                                        id="butcher_services"
                                        name="butcher_services"
                                        value={formData.butcher_profile.services}
                                        onChange={handleChange}
                                        placeholder="Kurban kesimi, Parçalama, Pay etme"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="butcher_price_range">Fiyat Aralığı (Opsiyonel)</label>
                                    <input
                                        type="text"
                                        id="butcher_price_range"
                                        name="butcher_price_range"
                                        value={formData.butcher_profile.price_range}
                                        onChange={handleChange}
                                        placeholder="1000-2000 TL"
                                    />
                                </div>
                            </div>
                        )}

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
                        </button>
                    </form>

                    <p className="login-link">
                        Zaten hesabın var mı? <Link to="/login">Giriş Yap</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
