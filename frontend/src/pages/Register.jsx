import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import { compressImage } from '../utils/imageUtils';
import './RegisterWizard.css';

const RegisterWizard = () => {
    const navigate = useNavigate();
    const { register, loading: authLoading } = useAuth();

    // Total steps reduced to 4 (Email -> Account -> Profile -> Summary)
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [kvkkAccepted, setKvkkAccepted] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        hasMinLength: false,
        hasUpperAndLower: false,
        hasNumber: false,
        hasSpecial: false
    });

    // Form data
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        passwordConfirm: '',
        firstName: '',
        lastName: '',
        countryCode: '+1',
        phone: '',
        is_butcher: false,
        profileImage: null,
        profileImagePreview: null
    });

    // Scroll to top on step change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));

        // Real-time password validation
        if (name === 'password') {
            setPasswordStrength({
                hasMinLength: value.length >= 8,
                hasUpperAndLower: /[A-Z]/.test(value) && /[a-z]/.test(value),
                hasNumber: /[0-9]/.test(value),
                hasSpecial: /[^A-Za-z0-9]/.test(value)
            });
        }

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Compress image before saving to state
                const compressedFile = await compressImage(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.7 });

                setFormData(prev => ({
                    ...prev,
                    profileImage: compressedFile,
                    profileImagePreview: URL.createObjectURL(compressedFile)
                }));
            } catch (err) {
                console.error("Image compression failed:", err);
                // Fallback to original file if compression fails
                setFormData(prev => ({
                    ...prev,
                    profileImage: file,
                    profileImagePreview: URL.createObjectURL(file)
                }));
            }
        }
    };

    const validateStep = () => {
        const newErrors = {};

        if (currentStep === 1) { // Email Step
            if (!formData.email.trim()) {
                newErrors.email = 'E-posta gereklidir';
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = 'Geçerli bir e-posta girin';
            }
        }

        if (currentStep === 2) { // Account Step (Username & Password)
            if (!formData.username.trim()) {
                newErrors.username = 'Kullanıcı adı gereklidir';
            } else if (formData.username.length < 3 || formData.username.length > 20) {
                newErrors.username = 'Kullanıcı adı 3-20 karakter arasında olmalıdır';
            }

            if (!formData.password) {
                newErrors.password = 'Şifre gereklidir';
            } else if (formData.password.length < 8) {
                newErrors.password = 'Şifre en az 8 karakter olmalıdır';
            } else {
                // Count how many criteria are met
                const criteriaCount = [
                    passwordStrength.hasUpperAndLower,
                    passwordStrength.hasNumber,
                    passwordStrength.hasSpecial,
                    passwordStrength.hasMinLength
                ].filter(Boolean).length;

                if (criteriaCount < 4) {
                    newErrors.password = 'Şifre tüm kriterleri karşılamalıdır';
                }
            }

            if (formData.password !== formData.passwordConfirm) {
                newErrors.passwordConfirm = 'Şifreler eşleşmiyor';
            }
        }

        if (currentStep === 3) { // Profile Step
            if (!formData.firstName.trim()) {
                newErrors.firstName = 'İsim gereklidir';
            } else if (formData.firstName.trim().length < 2) {
                newErrors.firstName = 'İsim en az 2 karakter olmalıdır';
            }

            if (!formData.lastName.trim()) {
                newErrors.lastName = 'Soyisim gereklidir';
            } else if (formData.lastName.trim().length < 2) {
                newErrors.lastName = 'Soyisim en az 2 karakter olmalıdır';
            }
        }

        setErrors(newErrors);
        return newErrors;
    };

    const handleNext = () => {
        const validationErrors = validateStep();
        if (Object.keys(validationErrors).length === 0) {
            setCurrentStep(prev => Math.min(4, prev + 1));
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(1, prev - 1));
        setErrors({});
    };

    const handleRegister = async () => {
        setLoading(true);
        setErrors({});

        try {
            // Use FormData for multipart/form-data upload
            const data = new FormData();
            data.append('first_name', formData.firstName.trim());
            data.append('last_name', formData.lastName.trim());
            data.append('email', formData.email.trim().toLowerCase());
            data.append('username', formData.username.trim());
            data.append('password', formData.password);
            data.append('phone_number', formData.phone.trim() || '');

            if (formData.is_butcher) {
                data.append('is_butcher', 'true');
            }

            if (formData.profileImage) {
                data.append('profile_image', formData.profileImage);
            }

            const result = await register(data);

            if (result.success) {
                // Show success feedback
                setErrors({ success: 'Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...' });
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setErrors(result.errors || { general: 'Kayıt başarısız oldu' });
                // If there's an error, we stay on Step 4 (Summary) or move to appropriate step
                // But generally displaying error banner is enough
            }
        } catch (err) {
            setErrors({ general: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
        } finally {
            setLoading(false);
        }
    };

    const getStepTitle = () => {
        const titles = {
            1: 'E-posta',
            2: 'Hesap Bilgileri',
            3: 'Profil',
            4: 'Özet'
        };
        return titles[currentStep];
    };

    return (
        <div className="register-wizard-page">
            <SEO
                title="Kayıt Ol"
                description="KurbanLink'e ücretsiz kayıt olun. Kurban hayvanı ilanı verin, güvenli alışveriş yapın ve kasap randevusu alın."
                url="https://kurbanlink.com/register"
            />
            <div className="register-wizard-container">
                <div className="register-wizard-card">
                    {/* Progress Indicator */}
                    <div className="progress-indicator">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${(currentStep / 4) * 100}%` }}
                            />
                        </div>
                        <div className="progress-text">
                            Adım {currentStep}/4: {getStepTitle()}
                        </div>
                    </div>

                    <h1>Kayıt Ol</h1>

                    {/* General Error */}
                    {errors.general && (
                        <div className="error-banner">{errors.general}</div>
                    )}

                    {/* Step 1: Email */}
                    {currentStep === 1 && (
                        <div className="wizard-step">
                            <p className="step-description">
                                Başlamak için e-posta adresinizi girin.
                            </p>

                            <div className="form-group">
                                <label htmlFor="email">E-posta *</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={errors.email ? 'error' : ''}
                                    placeholder="ad@example.com"
                                />
                                {errors.email && <span className="error-text">{errors.email}</span>}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Account Details */}
                    {currentStep === 2 && (
                        <div className="wizard-step">
                            <p className="step-description">
                                Hesap bilgilerinizi oluşturun.
                            </p>

                            <div className="form-group">
                                <label htmlFor="username">Kullanıcı Adı *</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className={errors.username ? 'error' : ''}
                                    placeholder="kullaniciadi123"
                                />
                                {errors.username && <span className="error-text">{errors.username}</span>}
                            </div>

                            <div className="form-group password-field-wrapper">
                                <label htmlFor="password">Şifre *</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`password-input ${errors.password ? 'error' : ''}`}
                                        placeholder="••••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="password-toggle-btn"
                                    >
                                        {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                                    </button>
                                </div>
                                
                                <div className="password-requirements-list">
                                    <div className={`requirement-item ${passwordStrength.hasMinLength ? 'met' : ''}`}>
                                        <span className="bullet">•</span>
                                        <span>En az 8 karakter</span>
                                        {passwordStrength.hasMinLength && <span className="check-icon">✓</span>}
                                    </div>
                                    <div className={`requirement-item ${passwordStrength.hasNumber ? 'met' : ''}`}>
                                        <span className="bullet">•</span>
                                        <span>En az 1 rakam</span>
                                        {passwordStrength.hasNumber && <span className="check-icon">✓</span>}
                                    </div>
                                    <div className={`requirement-item ${passwordStrength.hasSpecial ? 'met' : ''}`}>
                                        <span className="bullet">•</span>
                                        <span>En az 1 özel karakter (, : ! * ? - / & # = “ vb.)</span>
                                        {passwordStrength.hasSpecial && <span className="check-icon">✓</span>}
                                    </div>
                                    <div className={`requirement-item ${passwordStrength.hasUpperAndLower ? 'met' : ''}`}>
                                        <span className="bullet">•</span>
                                        <span>En az 1 büyük ve 1 küçük harf</span>
                                        {passwordStrength.hasUpperAndLower && <span className="check-icon">✓</span>}
                                    </div>
                                </div>
                                {errors.password && <span className="error-text">{errors.password}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="passwordConfirm">Şifre Tekrar *</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPasswordConfirm ? "text" : "password"}
                                        id="passwordConfirm"
                                        name="passwordConfirm"
                                        value={formData.passwordConfirm}
                                        onChange={handleChange}
                                        className={errors.passwordConfirm ? 'error' : ''}
                                        placeholder="Şifrenizi tekrar girin"
                                        style={{ paddingRight: '40px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordConfirm((prev) => !prev)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#6b7280',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: 0
                                        }}
                                    >
                                        {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {errors.passwordConfirm && <span className="error-text">{errors.passwordConfirm}</span>}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Profile */}
                    {currentStep === 3 && (
                        <div className="wizard-step">
                            <p className="step-description">
                                Profil bilgilerinizi girin.
                            </p>

                            <div className="form-group">
                                <label htmlFor="firstName">İsim *</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className={errors.firstName ? 'error' : ''}
                                    placeholder="Adınız"
                                />
                                {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName">Soyisim *</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className={errors.lastName ? 'error' : ''}
                                    placeholder="Soyadınız"
                                />
                                {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                            </div>

                            <div className="form-group">
                                <label>Profil Fotoğrafı (Opsiyonel)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '50%',
                                            backgroundColor: '#f0f0f0',
                                            backgroundImage: formData.profileImagePreview ? `url(${formData.profileImagePreview})` : 'none',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '1px solid #ddd'
                                        }}
                                    >
                                        {!formData.profileImagePreview && (
                                            <span style={{ fontSize: '24px', color: '#ccc' }}>📷</span>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            </div>

                            <div className="form-group phone-group">
                                <label htmlFor="phone">Telefon (Opsiyonel)</label>
                                <div className="phone-input-container" style={{ display: 'flex', gap: '10px' }}>
                                    <select
                                        name="countryCode"
                                        value={formData.countryCode || '+90'}
                                        onChange={handleChange}
                                        style={{ width: '100px', padding: '12px', borderRadius: '8px', border: '2px solid #e0e0e0', background: 'white' }}
                                    >
                                        <option value="+90">TR (+90)</option>
                                        <option value="+1">US (+1)</option>
                                        <option value="+44">UK (+44)</option>
                                        <option value="+49">DE (+49)</option>
                                        <option value="+33">FR (+33)</option>
                                        <option value="+39">IT (+39)</option>
                                        <option value="+34">ES (+34)</option>
                                        <option value="+31">NL (+31)</option>
                                        <option value="+32">BE (+32)</option>
                                        <option value="+41">CH (+41)</option>
                                        <option value="+43">AT (+43)</option>
                                        <option value="+46">SE (+46)</option>
                                        <option value="+47">NO (+47)</option>
                                        <option value="+45">DK (+45)</option>
                                        <option value="+358">FI (+358)</option>
                                        <option value="+30">GR (+30)</option>
                                        <option value="+351">PT (+351)</option>
                                        <option value="+48">PL (+48)</option>
                                        <option value="+420">CZ (+420)</option>
                                        <option value="+36">HU (+36)</option>
                                        <option value="+40">RO (+40)</option>
                                        <option value="+359">BG (+359)</option>
                                        <option value="+385">HR (+385)</option>
                                        <option value="+381">RS (+381)</option>
                                        <option value="+387">BA (+387)</option>
                                        <option value="+7">RU (+7)</option>
                                        <option value="+380">UA (+380)</option>
                                        <option value="+994">AZ (+994)</option>
                                        <option value="+995">GE (+995)</option>
                                        <option value="+7">KZ (+7)</option>
                                        <option value="+993">TM (+993)</option>
                                        <option value="+998">UZ (+998)</option>
                                        <option value="+996">KG (+996)</option>
                                        <option value="+86">CN (+86)</option>
                                        <option value="+81">JP (+81)</option>
                                        <option value="+82">KR (+82)</option>
                                        <option value="+91">IN (+91)</option>
                                        <option value="+92">PK (+92)</option>
                                        <option value="+98">IR (+98)</option>
                                        <option value="+964">IQ (+964)</option>
                                        <option value="+963">SY (+963)</option>
                                        <option value="+966">SA (+966)</option>
                                        <option value="+971">AE (+971)</option>
                                        <option value="+974">QA (+974)</option>
                                        <option value="+20">EG (+20)</option>
                                        <option value="+212">MA (+212)</option>
                                        <option value="+213">DZ (+213)</option>
                                        <option value="+216">TN (+216)</option>
                                        <option value="+61">AU (+61)</option>
                                        <option value="+1">CA (+1)</option>
                                        <option value="+55">BR (+55)</option>
                                        <option value="+54">AR (+54)</option>
                                        <option value="+52">MX (+52)</option>
                                    </select>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setFormData(prev => ({ ...prev, phone: val }));
                                        }}
                                        placeholder="5XX XXX XX XX"
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            </div>

                            <div className="form-group checkbox-group">
                                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
                                    <input
                                        type="checkbox"
                                        name="is_butcher"
                                        checked={formData.is_butcher || false}
                                        onChange={handleChange}
                                        style={{ width: '20px', height: '20px', accentColor: '#1F7A4D' }}
                                    />
                                    <span className="checkbox-text" style={{ fontSize: '15px', fontWeight: '500' }}>Kasaplık hizmeti veriyorum</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Summary */}
                    {currentStep === 4 && (
                        <div className="wizard-step">
                            <p className="step-description">
                                Bilgilerinizi kontrol edip kaydı tamamlayın.
                            </p>

                            <div className="summary-box">
                                <div className="summary-row">
                                    <span className="summary-label">E-posta:</span>
                                    <span className="summary-value">{formData.email}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">Kullanıcı Adı:</span>
                                    <span className="summary-value">{formData.username}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">İsim:</span>
                                    <span className="summary-value">{formData.firstName} {formData.lastName}</span>
                                </div>
                                {formData.phone && (
                                    <div className="summary-row">
                                        <span className="summary-label">Telefon:</span>
                                        <span className="summary-value">{formData.countryCode || '+90'} {formData.phone}</span>
                                    </div>
                                )}
                                {formData.profileImage && (
                                    <div className="summary-row">
                                        <span className="summary-label">Profil Fotoğrafı:</span>
                                        <span className="summary-value">Seçildi ✅</span>
                                    </div>
                                )}
                                <div className="summary-row">
                                    <span className="summary-label">Hesap Türü:</span>
                                    <span className="summary-value">
                                        {formData.is_butcher ? 'Kasap Hesabı' : 'Normal Kullanıcı'}
                                    </span>
                                </div>
                            </div>

                            {/* KVKK Onay Kutusu */}
                            <div className="kvkk-consent">
                                <label className="kvkk-label">
                                    <input
                                        type="checkbox"
                                        checked={kvkkAccepted}
                                        onChange={e => setKvkkAccepted(e.target.checked)}
                                        id="kvkk-checkbox"
                                    />
                                    <span>
                                        <a href="/kvkk" target="_blank" rel="noopener noreferrer">KVKK Aydınlatma Metni</a>'ni
                                        okudum ve kişisel verilerimin işlenmesine onay veriyorum. *
                                    </span>
                                </label>
                                {errors.kvkk && <span className="error-text">{errors.kvkk}</span>}
                            </div>

                            <button
                                type="button"
                                className="complete-btn"
                                onClick={handleRegister}
                                disabled={loading || authLoading || !kvkkAccepted}
                                title={!kvkkAccepted ? 'Lütfen önce KVKK metnini onaylayın' : ''}
                            >
                                {loading || authLoading ? 'Kaydediliyor...' : 'Kaydı Tamamla'}
                            </button>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="wizard-navigation">
                        {currentStep > 1 && currentStep < 5 && (
                            <button
                                type="button"
                                className="nav-btn back-btn"
                                onClick={handleBack}
                                disabled={loading}
                            >
                                <ArrowLeft size={18} /> Geri
                            </button>
                        )}

                        {currentStep < 4 && (
                            <button
                                type="button"
                                className="nav-btn next-btn"
                                onClick={handleNext}
                                disabled={loading}
                            >
                                İleri <ArrowRight size={18} />
                            </button>
                        )}
                    </div>

                    <div className="login-link">
                        Zaten hesabınız var mı? <Link to="/login">Giriş yapın</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterWizard;
