/**
 * City and district data for location dropdowns.
 * Organized by country code.
 */

export const LOCATIONS = {
    TR: {
        "Ankara": ["Çankaya", "Keçiören", "Gölbaşı", "Mamak", "Yenimahalle", "Etimesgut", "Sincan"],
        "İstanbul": ["Kadıköy", "Üsküdar", "Beşiktaş", "Şişli", "Beyoğlu", "Fatih", "Ümraniye", "Pendik"],
        "İzmir": ["Konak", "Karşıyaka", "Bornova", "Buca", "Çiğli", "Gaziemir"],
        "Antalya": ["Muratpaşa", "Kepez", "Konyaaltı", "Döşemealtı", "Aksu"],
        "Bursa": ["Osmangazi", "Yıldırım", "Nilüfer", "Gemlik", "İnegöl"],
        "Adana": ["Seyhan", "Yüreğir", "Çukurova", "Sarıçam"],
        "Konya": ["Meram", "Karatay", "Selçuklu"],
        "Gaziantep": ["Şahinbey", "Şehitkamil", "Oğuzeli"],
        "Kayseri": ["Melikgazi", "Kocasinan", "Talas"],
        "Mersin": ["Akdeniz", "Toroslar", "Mezitli", "Yenişehir"],
        "Diyarbakır": ["Bağlar", "Kayapınar", "Yenişehir", "Sur"],
        "Şanlıurfa": ["Eyyübiye", "Haliliye", "Karaköprü"],
        "Trabzon": ["Ortahisar", "Akçaabat", "Yomra"],
        "Samsun": ["İlkadım", "Atakum", "Canik", "Tekkeköy"],
        "Elazığ": ["Merkez", "Kovancılar", "Palu"],
        "Malatya": ["Battalgazi", "Yeşilyurt", "Darende"],
    },
    DE: {
        "Berlin": ["Mitte", "Kreuzberg", "Charlottenburg", "Neukölln", "Tempelhof"],
        "München": ["Altstadt", "Schwabing", "Haidhausen"],
        "Hamburg": ["Altona", "Eimsbüttel", "Hamburg-Mitte"],
    }
};

/**
 * Get cities for a given country code.
 */
export const getCitiesForCountry = (countryCode) => {
    return Object.keys(LOCATIONS[countryCode] || {});
};

/**
 * Get districts for a given country and city.
 */
export const getDistrictsForCity = (countryCode, city) => {
    return LOCATIONS[countryCode]?.[city] || [];
};
export const cities = Object.keys(LOCATIONS.TR);
