import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { fetchPartnerships, createPartnership, closePartnership } from '../../api/partnerships';
import { fetchAnimals } from '../../api/animals';
import { animalTypeLabel, partnershipStatusLabel } from '../../utils/labels';
import { formatTRY, formatDateTR } from '../../utils/format';
import LoadingState from '../../components/state/LoadingState';
import EmptyState from '../../components/state/EmptyState';
import ErrorState from '../../components/state/ErrorState';
import './Partnerships.css';
import { CheckCircle2, AlertTriangle, MapPin } from '../../ui/icons';

const Partnerships = () => {
    const navigate = useNavigate();
    const [partnerships, setPartnerships] = useState([]);
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cityFilter, setCityFilter] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        city: '',
        person_count: '',
        animal: '',
        description: ''
    });
    const [formError, setFormError] = useState(null);
    const [formSuccess, setFormSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Fetch partnerships
            const partnershipsData = await fetchPartnerships();
            // Handle both array and paginated response
            const partnershipsList = Array.isArray(partnershipsData)
                ? partnershipsData
                : (partnershipsData.results || []);
            setPartnerships(partnershipsList);

            // Fetch multiple pages of animals for dropdown (up to 5 pages max)
            const allAnimals = [];
            const seenIds = new Set(); // Track unique IDs
            let page = 1;
            const maxPages = 5;

            while (page <= maxPages) {
                try {
                    // fetchAnimals supports object params ({ page, animal_type, etc })
                    const animalsData = await fetchAnimals({ page });

                    if (animalsData.results && animalsData.results.length > 0) {
                        // Add only unique animals (deduplicate by ID)
                        animalsData.results.forEach(animal => {
                            if (!seenIds.has(animal.id)) {
                                seenIds.add(animal.id);
                                allAnimals.push(animal);
                            }
                        });
                    }

                    // Stop if no more pages
                    if (!animalsData.next) {
                        break;
                    }

                    page++;
                } catch (err) {
                    console.error(`Failed to fetch animals page ${page}:`, err);
                    break;
                }
            }

            // Sort by created_at descending (newest first) for better UX
            allAnimals.sort((a, b) => {
                // Use Date.parse for safer parsing, fallback to 0 if invalid
                const timeA = Date.parse(a.created_at);
                const timeB = Date.parse(b.created_at);
                const ta = Number.isFinite(timeA) ? timeA : 0;
                const tb = Number.isFinite(timeB) ? timeB : 0;
                return tb - ta; // Descending (newest first)
            });

            setAnimals(allAnimals);
        } catch (err) {
            console.error('Failed to load partnerships:', err);
            setError('Veriler yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = async () => {
        try {
            setLoading(true);
            const data = await fetchPartnerships({ city: cityFilter });
            setPartnerships(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            console.error('Filter failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(false);
        setSubmitting(true);

        try {
            const payload = {
                city: formData.city,
                person_count: parseInt(formData.person_count)
            };

            if (formData.animal) {
                payload.animal = parseInt(formData.animal);
            }

            if (formData.description) {
                payload.description = formData.description;
            }

            await createPartnership(payload);
            setFormSuccess(true);
            setFormData({ city: '', person_count: '', animal: '', description: '' });

            // Reload partnerships
            await loadData();

            setTimeout(() => setFormSuccess(false), 5000);
        } catch (err) {
            console.error('Create partnership failed:', err);
            const errorMsg = err.response?.data?.city?.[0]
                || err.response?.data?.person_count?.[0]
                || err.response?.data?.detail
                || 'Ortaklık oluşturulamadı.';
            setFormError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = async (id) => {
        if (!window.confirm('Bu ortaklık ilanını kapatmak istediğinize emin misiniz?')) {
            return;
        }

        try {
            await closePartnership(id);
            await loadData();
        } catch (err) {
            console.error('Close failed:', err);
            alert('İlan kapatılamadı.');
        }
    };

    return (
        <div className="partnerships-page">


            <div className="container partnerships-content">
                <div className="page-header">
                    <h1>Kurban Ortaklığı</h1>
                    <p className="subtitle">Ortakları bulun veya ortaklık ilanı oluşturun</p>
                </div>

                <div className="partnerships-layout">
                    {/* Create Partnership Form */}
                    <aside className="create-section">
                        <h2>Ortaklık İlanı Oluştur</h2>

                        {formSuccess && (
                            <div className="success-banner">
                                <CheckCircle2 size={16} style={{ marginRight: '0.5rem' }} />
                                Ortaklık ilanınız oluşturuldu!
                            </div>
                        )}

                        {formError && (
                            <div className="error-banner">
                                <AlertTriangle size={16} style={{ marginRight: '0.5rem' }} />
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="partnership-form">
                            <div className="form-group">
                                <label htmlFor="city">Şehir *</label>
                                <input
                                    type="text"
                                    id="city"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    required
                                    placeholder="Örn: Ankara"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="person_count">Aranan Ortak Sayısı *</label>
                                <input
                                    type="number"
                                    id="person_count"
                                    min="1"
                                    value={formData.person_count}
                                    onChange={(e) => setFormData({ ...formData, person_count: e.target.value })}
                                    required
                                    placeholder="Örn: 3"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="animal">İlan Seç (Opsiyonel)</label>
                                <select
                                    id="animal"
                                    value={formData.animal}
                                    onChange={(e) => setFormData({ ...formData, animal: e.target.value })}
                                >
                                    <option value="">İlan seçmeyin veya seçin</option>
                                    {animals.map(animal => (
                                        <option key={animal.id} value={animal.id}>
                                            {animal.breed} - {animal.location} - {formatTRY(animal.price)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Açıklama (Opsiyonel)</label>
                                <textarea
                                    id="description"
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Ortaklık hakkında not..."
                                />
                            </div>

                            <button type="submit" disabled={submitting} className="btn-primary">
                                {submitting ? 'Oluşturuluyor...' : 'Ortaklık Oluştur'}
                            </button>
                        </form>
                    </aside>

                    {/* Browse Partnerships */}
                    <main className="browse-section">
                        <div className="browse-header">
                            <h2>Mevcut Ortaklıklar</h2>
                            <div className="filter-controls">
                                <input
                                    type="text"
                                    placeholder="Şehir filtrele..."
                                    value={cityFilter}
                                    onChange={(e) => setCityFilter(e.target.value)}
                                />
                                <button onClick={applyFilter} className="btn-secondary">
                                    Filtrele
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <LoadingState />
                        ) : error ? (
                            <ErrorState message={error} onRetry={loadData} />
                        ) : partnerships.length === 0 ? (
                            <EmptyState message="Henüz ortaklık ilanı bulunmamaktadır." />
                        ) : (
                            <div className="partnerships-grid">
                                {partnerships.map(partnership => (
                                    <div
                                        key={partnership.id}
                                        className="partnership-card"
                                        onClick={() => navigate(`/partnerships/${partnership.id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="card-header">
                                            <h3>
                                                <MapPin size={18} style={{ marginRight: '0.5rem' }} />
                                                {partnership.city}
                                            </h3>
                                            <span className={`status-badge status-${partnership.status.toLowerCase()}`}>
                                                {partnershipStatusLabel(partnership.status)}
                                            </span>
                                        </div>

                                        <div className="card-body">
                                            <p className="person-count">
                                                <strong>Aranan Ortak:</strong> {partnership.person_count} kişi
                                            </p>

                                            {partnership.animal_details && (
                                                <div className="animal-info">
                                                    <p><strong>İlan:</strong></p>
                                                    <p>{partnership.animal_details.breed}</p>
                                                    <p>{animalTypeLabel(partnership.animal_details.animal_type)} - {formatTRY(partnership.animal_details.price)}</p>
                                                </div>
                                            )}

                                            {partnership.description && (
                                                <p className="description">{partnership.description}</p>
                                            )}

                                            <p className="meta">
                                                <small>{formatDateTR(partnership.created_at)}</small>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Partnerships;
