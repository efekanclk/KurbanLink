/**
 * Centralized formatting utilities for Turkish locale
 * Consistent formatting for currency, dates, times, and units
 */

/**
 * Format price in Turkish Lira
 * @param {number|string} value - Price value
 * @param {boolean} showDecimals - Whether to show decimal places
 * @returns {string} Formatted price with ₺ symbol
 */
export const formatTRY = (value, showDecimals = false) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '₺0';

    if (showDecimals) {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(num);
    }

    // For cards and lists: round to integer
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0
    }).format(Math.round(num));
};

/**
 * Format date in Turkish locale
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted date (e.g., "17 Ocak 2026")
 */
export const formatDateTR = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

/**
 * Format time from HH:MM:SS to HH:MM
 * @param {string} timeString - Time string (e.g., "14:30:00")
 * @returns {string} Formatted time (e.g., "14:30")
 */
export const formatTimeTR = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
};

/**
 * Format date and time in Turkish locale
 * @param {string} isoString - ISO datetime string
 * @returns {string} Formatted datetime (e.g., "17 Ocak 2026 14:30")
 */
export const formatDateTimeTR = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';

    return date.toLocaleString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Format date and time in short format
 * @param {string} isoString - ISO datetime string
 * @returns {string} Short formatted datetime (e.g., "17.01.2026 14:30")
 */
export const formatDateTimeShort = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';

    return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Format weight in kilograms
 * @param {number} value - Weight value
 * @returns {string} Formatted weight (e.g., "20 kg")
 */
export const formatKg = (value) => {
    if (!value && value !== 0) return '';
    return `${value} kg`;
};

/**
 * Format age in years
 * @param {number} age - Age value
 * @returns {string} Formatted age (e.g., "3 yaş")
 */
export const formatAge = (age) => {
    if (!age && age !== 0) return '';
    return `${age} yaş`;
};

/**
 * Format relative time (e.g., "5 dakika önce")
 * @param {string} isoString - ISO datetime string
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;

    return formatDateTR(isoString);
};
