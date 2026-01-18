import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SearchFilters from '../components/search/SearchFilters';
import ListingCard from '../components/ListingCard';
import { fetchAnimals, fetchAnimalImages } from '../api/animals';
import './SearchPage.css';

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [listings, setListings] = useState([]);
    const [images, setImages] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        loadResults();
    }, [searchParams]);

    const loadResults = async () => {
        setLoading(true);
        setError(null);

        try {
            // Convert searchParams to object
            const params = {};
            searchParams.forEach((value, key) => {
                if (value) params[key] = value;
            });

            const page = params.page || 1;
            params.page = page;

            // Store breed for client-side filtering if needed
            const breedFilter = params.breed;

            // Fetch from backend (breed not supported, so exclude it from API call)
            const apiParams = { ...params };
            delete apiParams.breed;

            const data = await fetchAnimals(apiParams);

            let results = data.results;

            // Client-side breed filtering if breed param exists
            if (breedFilter) {
                results = results.filter(listing =>
                    listing.breed && listing.breed.toLowerCase().includes(breedFilter.toLowerCase())
                );
            }

            setListings(results);
            setTotalCount(data.count);
            setCurrentPage(parseInt(page));
            setTotalPages(Math.ceil(data.count / 10));

            // Fetch images
            const imageMap = {};
            for (const listing of results) {
                try {
                    const imgs = await fetchAnimalImages(listing.id);
                    const primary = imgs.find(img => img.is_primary) || imgs[0];
                    if (primary) imageMap[listing.id] = primary;
                } catch (e) {
                    // Ignore
                }
            }
            setImages(imageMap);

        } catch (err) {
            console.error(err);
            setError('Sonuçlar yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterApply = (newFilters) => {
        // Update URL with new filters
        const params = new URLSearchParams(newFilters);
        params.set('page', '1'); // Reset to page 1
        setSearchParams(params);
    };

    const handleFilterReset = () => {
        setSearchParams({});
    };

    const handlePageChange = (newPage) => {
        const params = {};
        searchParams.forEach((value, key) => {
            params[key] = value;
        });
        params.page = newPage;
        setSearchParams(params);
    };

    // Parse current filters from URL
    const currentFilters = {};
    searchParams.forEach((value, key) => {
        if (key !== 'page') currentFilters[key] = value;
    });

    return (
        <div className="search-page">
            <Navbar />

            <div className="container search-layout">
                <aside className="search-sidebar">
                    <SearchFilters
                        initialFilters={currentFilters}
                        onApply={handleFilterApply}
                        onReset={handleFilterReset}
                    />
                </aside>

                <main className="search-results">
                    <div className="results-header">
                        <h2>Arama Sonuçları</h2>
                        <span className="results-count">
                            {totalCount} ilan bulundu
                        </span>
                    </div>

                    {loading ? (
                        <div className="loading-state">Yükleniyor...</div>
                    ) : error ? (
                        <div className="error-state">{error}</div>
                    ) : listings.length === 0 ? (
                        <div className="empty-state">
                            <p>Aradığınız kriterlere uygun ilan bulunamadı.</p>
                            <button className="btn-reset" onClick={handleFilterReset}>
                                Filtreleri Temizle
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="results-grid">
                                {listings.map((listing) => (
                                    <ListingCard
                                        key={listing.id}
                                        listing={listing}
                                        image={images[listing.id]}
                                    />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        className="btn-page"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        Önceki
                                    </button>

                                    <span className="page-indicator">
                                        Sayfa {currentPage} / {totalPages}
                                    </span>

                                    <button
                                        className="btn-page"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Sonraki
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default SearchPage;
