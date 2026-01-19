import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FilterBar.css';

const FilterBar = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        animal_type: '',
        breed: '',
        age_range: ''
    });

    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = () => {
        // Map simplified filters to query params
        const params = new URLSearchParams();

        if (filters.animal_type) params.append('animal_type', filters.animal_type);

        // Age range handling (MVP simplified)
        if (filters.age_range) {
            const [min, max] = filters.age_range.split('-');
            if (min) params.append('min_age', min);
            if (max && max !== '+') params.append('max_age', max);
        }

        navigate(`/search?${params.toString()}`);
    };

    return (
        <div className="filter-bar">
            <div className="filter-group">
                <label>Hayvan Grubu</label>
                <select name="animal_type" value={filters.animal_type} onChange={handleChange}>
                    <option value="">Hepsi</option>
                    <option value="KUCUKBAS">Küçükbaş</option>
                    <option value="BUYUKBAS">Büyükbaş</option>
                </select>
            </div>

            <div className="filter-group">
                <label>Cins</label>
                <select name="breed" value={filters.breed} onChange={handleChange} disabled>
                    <option value="">Tüm Cinsler (Yakında)</option>
                    {/* Populate dynamically in future phases */}
                </select>
            </div>

            <div className="filter-group">
                <label>Yaş</label>
                <select name="age_range" value={filters.age_range} onChange={handleChange}>
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
    );
};

export default FilterBar;
