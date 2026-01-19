import React from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './HomeSidebar.css';

const HomeSidebar = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Get current animal type filter
    const currentType = searchParams.get('animal_type');

    const handleCategoryClick = (type) => {
        const newParams = new URLSearchParams(searchParams);
        if (type) {
            newParams.set('animal_type', type);
        } else {
            newParams.delete('animal_type');
        }
        setSearchParams(newParams);
    };

    const handleProtectedLink = (e, path) => {
        e.preventDefault();
        if (!user) {
            alert('Bu işlem için giriş yapmalısınız.');
            navigate(`/login?next=${encodeURIComponent(path)}`);
        } else {
            navigate(path);
        }
    };

    return (
        <aside className="home-sidebar">
            <div className="sidebar-section">
                <h3 className="sidebar-title">Kategoriler</h3>
                <ul className="sidebar-list">
                    <li>
                        <button
                            className={`sidebar-link ${!currentType ? 'active' : ''}`}
                            onClick={() => handleCategoryClick(null)}
                        >
                            Tüm İlanlar
                        </button>
                    </li>
                    <li>
                        <button
                            className={`sidebar-link ${currentType === 'KUCUKBAS' ? 'active' : ''}`}
                            onClick={() => handleCategoryClick('KUCUKBAS')}
                        >
                            Küçükbaş
                        </button>
                    </li>
                    <li>
                        <button
                            className={`sidebar-link ${currentType === 'BUYUKBAS' ? 'active' : ''}`}
                            onClick={() => handleCategoryClick('BUYUKBAS')}
                        >
                            Büyükbaş
                        </button>
                    </li>
                </ul>
            </div>

            <div className="sidebar-section">
                <h3 className="sidebar-title">Hızlı Erişim</h3>
                <ul className="sidebar-list">
                    <li>
                        <Link to="/search" className="sidebar-link">
                            🔍 Detaylı Arama
                        </Link>
                    </li>
                    <li>
                        <a
                            href="/partnerships"
                            className="sidebar-link partnership-link"
                            onClick={(e) => handleProtectedLink(e, '/partnerships')}
                        >
                            {user ? '🤝 Kurban Ortaklığı' : '🔒 Kurban Ortaklığı'}
                        </a>
                    </li>
                </ul>
            </div>
        </aside>
    );
};

export default HomeSidebar;
