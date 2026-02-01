import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import ButcherCard from '../../components/butchers/ButcherCard';
import { fetchButcherProfiles } from '../../api/butchers';
import { ButcherIcon } from '../../ui/icons';
import './ButcherList.css';

const ButcherList = () => {
    const navigate = useNavigate();
    const [butchers, setButchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadButchers();
    }, []);

    const loadButchers = async () => {
        try {
            const data = await fetchButcherProfiles();
            setButchers(data);
        } catch (err) {
            console.error('Failed to load butchers:', err);
            setError('Kasaplar yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="butcher-list-page">


            <div className="container">
                <div className="page-header">
                    <button onClick={() => navigate('/')} className="back-btn" style={{ background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                        ← İlanlara Dön
                    </button>
                    <h1>Kasap Bul</h1>
                    <p className="subtitle">
                        Güvenilir kasapları keşfedin ve randevu alın
                    </p>
                </div>

                {loading ? (
                    <div className="loading-state">Kasaplar yükleniyor...</div>
                ) : error ? (
                    <div className="error-state">
                        <p>{error}</p>
                        <button onClick={loadButchers} className="btn-retry">
                            Tekrar Dene
                        </button>
                    </div>
                ) : butchers.length === 0 ? (
                    <div className="empty-state">
                        <ButcherIcon size={48} className="empty-icon-custom" style={{ color: '#9CA3AF', marginBottom: '1rem' }} />
                        <p>Henüz kayıtlı kasap bulunmamaktadır.</p>
                    </div>
                ) : (
                    <div className="butchers-grid">
                        {butchers.map(butcher => (
                            <ButcherCard key={butcher.id} butcher={butcher} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ButcherList;
