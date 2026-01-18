import React, { useState, useEffect } from 'react';
import './SearchFilters.css';

const SearchFilters = ({ initialFilters = {}, onApply, onReset }) => {
    const [filters, setFilters] = useState({
        animal_type: '',
        location: '',
        min_price: '',
        max_price: '',
        min_age: '',
        max_age: '',
        min_weight: '',
        max_weight: '',
        ...initialFilters
    });

    useEffect(() => {
        // Update local state when initialFilters change
        setFilters(prev => ({ ...prev, ...initialFilters }));
    }, [initialFilters]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApply = () => {
        // Remove empty values before sending
        const cleanedFilters = Object.entries(filters).reduce((acc, [key, value]) => {
            if (value && value.trim && value.trim() !== '') {
                acc[key] = value;
            } else if (value && typeof value === 'number') {
                acc[key] = value;
            }
            return acc;
        }, {});

        onApply(cleanedFilters);
    };

    const handleReset = () => {
        const emptyFilters = {
            animal_type: '',
            location: '',
            min_price: '',
            max_price: '',
            min_age: '',
            max_age: '',
            min_weight: '',
            max_weight: ''
        };
        setFilters(emptyFilters);
        onReset();
    };

    return (
        <div className="search-filters">
            <h3>Filtreler</h3>

            <div className="filter-section">
                <label>Tür</label>
                <select name="animal_type" value={filters.animal_type} onChange={handleChange}>
                    <option value="">Hepsi</option>
                    <option value="KUCUKBAS">Küçükbaş</option>
                    <option value="BUYUKBAS">Büyükbaş</option>
                </select>
            </div>

            <div className="filter-section">
                <label>Konum (Şehir)</label>
                <input
                    type="text"
                    name="location"
                    placeholder="Şehir ara..."
                    value={filters.location}
                    onChange={handleChange}
                />
            </div>

            <div className="filter-section">
                <label>Fiyat (₺)</label>
                <div className="range-inputs">
                    <input
                        type="number"
                        name="min_price"
                        placeholder="Min"
                        value={filters.min_price}
                        onChange={handleChange}
                    />
                    <span>-</span>
                    <input
                        type="number"
                        name="max_price"
                        placeholder="Max"
                        value={filters.max_price}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="filter-section">
                <label>Yaş</label>
                <div className="range-inputs">
                    <input
                        type="number"
                        name="min_age"
                        placeholder="Min"
                        value={filters.min_age}
                        onChange={handleChange}
                    />
                    <span>-</span>
                    <input
                        type="number"
                        name="max_age"
                        placeholder="Max"
                        value={filters.max_age}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="filter-section">
                <label>Ağırlık (KG)</label>
                <div className="range-inputs">
                    <input
                        type="number"
                        name="min_weight"
                        placeholder="Min"
                        value={filters.min_weight}
                        onChange={handleChange}
                    />
                    <span>-</span>
                    <input
                        type="number"
                        name="max_weight"
                        placeholder="Max"
                        value={filters.max_weight}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="filter-actions">
                <button className="btn-apply" onClick={handleApply}>Filtrele</button>
                <button className="btn-clear" onClick={handleReset}>Sıfırla</button>
            </div>
        </div>
    );
};

export default SearchFilters;
