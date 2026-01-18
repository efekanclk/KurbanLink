import apiClient from './axios';

// Fetch animals with support for filters
export const fetchAnimals = async (params = {}) => {
    // params can be { page, animal_type, min_price, max_price, location, ... }
    const queryString = new URLSearchParams(params).toString();
    const response = await apiClient.get(`/api/animals/?${queryString}`);
    return response.data;  // Returns { count, next, previous, results }
};

// Fetch ALL animals by following pagination
export const fetchAllAnimals = async () => {
    let allAnimals = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const data = await fetchAnimals(page);
        allAnimals = [...allAnimals, ...data.results];

        // Check if there's a next page
        hasMore = data.next !== null;
        page++;
    }

    return allAnimals;
};

export const fetchAnimal = async (id) => {
    const response = await apiClient.get(`/api/animals/${id}/`);
    return response.data;
};

export const fetchAnimalImages = async (listingId) => {
    const response = await apiClient.get(`/api/animals/${listingId}/images/`);
    return response.data;
};
