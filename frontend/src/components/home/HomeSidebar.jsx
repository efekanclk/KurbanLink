import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { cities } from '../../data/locations';
import { Search, PartnershipIcon, Filter, X, Heart, ClipboardList, Calendar, ButcherIcon } from '../../ui/icons';
import './HomeSidebar.css';

const HomeSidebar = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Get current filter values
    const currentType = searchParams.get('animal_type');
    const currentGender = searchParams.get('gender');
    const currentCity = searchParams.get('city');
    const currentDate = searchParams.get('date_posted');

    const handleFilterChange = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        setSearchParams(newParams);
    };

    const handleCategoryClick = (type) => {
        handleFilterChange('animal_type', type);
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

    const toggleFilter = () => {
        setIsFilterOpen(!isFilterOpen);
    };

    const closeFilter = () => {
        setIsFilterOpen(false);
    };

    // ESC key and body scroll lock for filter modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isFilterOpen) {
                closeFilter();
            }
        };

        if (isFilterOpen) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleEscape);
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isFilterOpen]);

    // Render filter content (shared between desktop sidebar and mobile modal)
    const renderFilterContent = () => (
        <>
            {/* 0. Hızlı İşlemler (Birleştirilmiş) */}
            <div className="sidebar-section">
                <h3 className="sidebar-title">Hızlı İşlemler</h3>
                <ul className="sidebar-list">
                    <li>
                        <Link to="/butchers" className="sidebar-link partnership-link">
                            <ButcherIcon size={16} />
                            Kasap Bul
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/partnerships" 
                            className="sidebar-link partnership-link"
                            onClick={(e) => handleProtectedLink(e, '/partnerships')}
                        >
                            <PartnershipIcon size={16} />
                            Ortak Bul (Hisse)
                        </Link>
                    </li>
                    <li>
                        <Link to="/search" className="sidebar-link partnership-link">
                            <Search size={16} />
                            Detaylı Arama
                        </Link>
                    </li>
                    {user && (
                        <>
                            <li>
                                <Link to="/favorites" className="sidebar-link partnership-link">
                                    <Heart size={16} />
                                    Favorilerim
                                </Link>
                            </li>
                            <li>
                                <Link to="/seller/listings" className="sidebar-link partnership-link">
                                    <ClipboardList size={16} />
                                    İlanlarım
                                </Link>
                            </li>
                            {user.roles?.includes('BUTCHER') && (
                                <li>
                                    <Link to="/butcher/appointments" className="sidebar-link partnership-link">
                                        <Calendar size={16} />
                                        Randevularım
                                    </Link>
                                </li>
                            )}
                        </>
                    )}
                </ul>
            </div>

            {/* 1. Kategoriler */}
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

            {/* 2. Filtreler */}
            <div className="sidebar-section">
                <h3 className="sidebar-title">Filtreler</h3>

                {/* Cinsiyet */}
                <div className="filter-group">
                    <label className="filter-label">Cinsiyet</label>
                    <div className="radio-group">
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="gender"
                                checked={!currentGender}
                                onChange={() => handleFilterChange('gender', null)}
                            /> Hepsi
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="gender"
                                value="ERKEK"
                                checked={currentGender === 'ERKEK'}
                                onChange={() => handleFilterChange('gender', 'ERKEK')}
                            /> Erkek
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="gender"
                                value="DISI"
                                checked={currentGender === 'DISI'}
                                onChange={() => handleFilterChange('gender', 'DISI')}
                            /> Dişi
                        </label>
                    </div>
                </div>

                {/* Şehir */}
                <div className="filter-group">
                    <label className="filter-label">Şehir</label>
                    <select
                        className="filter-select"
                        value={currentCity || ''}
                        onChange={(e) => handleFilterChange('city', e.target.value)}
                    >
                        <option value="">Tüm Şehirler</option>
                        {cities.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                </div>

                {/* Eklenme Tarihi */}
                <div className="filter-group">
                    <label className="filter-label">Eklenme Tarihi</label>
                    <div className="radio-group">
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="date"
                                checked={!currentDate}
                                onChange={() => handleFilterChange('date_posted', null)}
                            /> Tüm Zamanlar
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="date"
                                value="today"
                                checked={currentDate === 'today'}
                                onChange={() => handleFilterChange('date_posted', 'today')}
                            /> Bugün
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="date"
                                value="week"
                                checked={currentDate === 'week'}
                                onChange={() => handleFilterChange('date_posted', 'week')}
                            /> Son 7 Gün
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="date"
                                value="month"
                                checked={currentDate === 'month'}
                                onChange={() => handleFilterChange('date_posted', 'month')}
                            /> Bu Ay
                        </label>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="home-sidebar desktop-only">
                {renderFilterContent()}
            </aside>

            {/* Mobile Filter Button */}
            <button className="mobile-filter-btn" onClick={toggleFilter}>
                <Filter size={20} />
                <span>Filtrele</span>
            </button>

            {/* Mobile Filter Modal */}
            {isFilterOpen && (
                <>
                    <div className="filter-overlay" onClick={closeFilter} />
                    <div className="filter-modal">
                        <div className="filter-modal-header">
                            <h2>Filtreler</h2>
                            <button className="filter-close-btn" onClick={closeFilter}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="filter-modal-content">
                            {renderFilterContent()}
                        </div>
                        <div className="filter-modal-footer">
                            <button className="filter-apply-btn" onClick={closeFilter}>
                                Uygula
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default HomeSidebar;
