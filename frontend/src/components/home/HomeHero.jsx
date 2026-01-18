import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeHero.css';

const HomeHero = ({ onSearch, breeds = [] }) => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        animalType: '',
        breed: '',
        ageRange: ''
    });

    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = () => {
        // Build query params
        const params = new URLSearchParams();

        // Animal type mapping
        if (filters.animalType) {
            params.append('animal_type', filters.animalType);
        }

        // Breed (client-side filter on search page)
        if (filters.breed) {
            params.append('breed', filters.breed);
        }

        // Age range mapping
        if (filters.ageRange) {
            const [min, max] = filters.ageRange.split('-');
            if (min) params.append('min_age', min);
            if (max && max !== '+') params.append('max_age', max);
        }

        navigate(`/search?${params.toString()}`);
    };

    return (
        <section className="hero-section">
            <div className="container hero-content">
                <h1 className="hero-title">
                    Kurbanlık Hayvan<br />Alım-Satım Platformu
                </h1>

                <div className="filter-bar">
                    <div className="filter-group">
                        <label>Tür</label>
                        <select name="animalType" value={filters.animalType} onChange={handleChange}>
                            <option value="">Hepsi</option>
                            <option value="KUCUKBAS">Küçükbaş</option>
                            <option value="BUYUKBAS">Büyükbaş</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Cins</label>
                        <select name="breed" value={filters.breed} onChange={handleChange}>
                            <option value="">Tüm Cinsler</option>
                            {breeds.map(breed => (
                                <option key={breed} value={breed}>{breed}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Yaş</label>
                        <select name="ageRange" value={filters.ageRange} onChange={handleChange}>
                            <option value="">Tüm Yaşlar</option>
                            <option value="0-1">0 - 1 Yaş</option>
                            <option value="2-4">2 - 4 Yaş</option>
                            <option value="5-8">5 - 8 Yaş</option>
                            <option value="9-+">9+ Yaş</option>
                        </select>
                    </div>

                    <button className="btn-search" onClick={handleSearch}>
                        Ara
                    </button>
                </div>
            </div>
        </section>
    );
};

export default HomeHero;
