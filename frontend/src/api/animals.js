import apiClient from './axios';

export const fetchAnimals = async () => {
    const response = await apiClient.get('/api/animals/');
    return response.data;
};

export const fetchAnimalImages = async (listingId) => {
    const response = await apiClient.get(`/api/animals/${listingId}/images/`);
    return response.data;
};
