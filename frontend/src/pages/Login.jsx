import { useState } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import SEO from '../components/SEO';
import './Login.css';

const Login = () => {
    // SEO injected at render time
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { login, loading, error } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const successMessage = location.state?.success;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(email, password);
        if (success) {
            const nextPath = searchParams.get('next') || '/';
            navigate(nextPath);
        }
    };

    return (
        <div className="login-page">
            <SEO
                title="Giriş Yap"
                description="KurbanLink hesabınıza giriş yapın. Kurban hayvanı ilanlarını görüntüleyin, favori ilanlarınızı kaydedin ve satıcılarla iletişim kurun."
                url="https://kurbanlink.com/login"
            />
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <h1>KurbanLink</h1>
                        <h2>Giriş Yap</h2>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">E-posta</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Şifre</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
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
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>


                        {successMessage && <div className="success-message" style={{ backgroundColor: '#d4edda', color: '#155724', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>{successMessage}</div>}

                        {error && <div className="error">{error}</div>}

                        <button type="submit" disabled={loading} className="submit-btn">
                            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </form>

                    <p className="register-link">
                        Hesabın yok mu? <Link to="/register">Kayıt Ol</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
