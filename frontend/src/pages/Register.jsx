import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Register.css';

const Register = () => {
    const navigate = useNavigate();
    const { register, loading } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        roles: {
            SELLER: false,
            BUTCHER: false
        }
    });

    const [errors, setErrors] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleRoleToggle = (role) => {
        setFormData(prev => ({
            ...prev,
            roles: {
                ...prev.roles,
                [role]: !prev.roles[role]
            }
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim()) {
            newErrors.email = 'E-posta gereklidir';
        }
        if (!formData.password) {
            newErrors.password = 'Şifre gereklidir';
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Şifreler eşleşmiyor';
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

        const payload = {
            email: formData.email.trim(),
            password: formData.password,
        };

        const selectedRoles = [];
        if (formData.roles.SELLER) selectedRoles.push('SELLER');
        if (formData.roles.BUTCHER) selectedRoles.push('BUTCHER');

        if (selectedRoles.length > 0) {
            payload.roles = selectedRoles;
        }

        const result = await register(payload);

        if (result.success) {
            navigate('/');
        } else {
            if (result.errors) {
                const backendErrors = result.errors;
                const newFieldErrors = {};

                if (backendErrors.email) {
                    newFieldErrors.email = Array.isArray(backendErrors.email)
                        ? backendErrors.email[0]
                        : backendErrors.email;
                }

                if (backendErrors.password) {
                    newFieldErrors.password = Array.isArray(backendErrors.password)
                        ? backendErrors.password.join(' ')
                        : backendErrors.password;
                }

                setFieldErrors(newFieldErrors);
            }
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

                        <div className="form-group">
                            <label>Hesap Türü (İsteğe Bağlı)</label>
                            <div className="role-selection">
                                <div className="role-item">
                                    <input
                                        type="checkbox"
                                        id="seller"
                                        checked={formData.roles.SELLER}
                                        onChange={() => handleRoleToggle('SELLER')}
                                    />
                                    <label htmlFor="seller">Satıc</label>
                                </div>
                                <div className="role-item">
                                    <input
                                        type="checkbox"
                                        id="butcher"
                                        checked={formData.roles.BUTCHER}
                                        onChange={() => handleRoleToggle('BUTCHER')}
                                    />
                                    <label htmlFor="butcher">Kasap</label>
                                </div>
                            </div>
                            <p className="help-text">
                                Tüm kullanıcılar otomatik olarak alıcı hesabına sahiptir.
                            </p>
                        </div>

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
