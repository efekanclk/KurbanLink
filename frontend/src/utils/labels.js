/**
 * Centralized label mappings for Turkish localization
 * Single source of truth for all user-facing labels
 */

/**
 * Convert role code to Turkish label
 * @param {string} code - Role code (BUYER, SELLER, BUTCHER)
 * @returns {string} Turkish label
 */
export const roleLabel = (code) => {
    const map = {
        'BUYER': 'Alıcı',
        'SELLER': 'Satıcı',
        'BUTCHER': 'Kasap'
    };
    return map[code?.toUpperCase()] || code;
};

/**
 * Convert animal type code to Turkish label
 * @param {string} code - Animal type code
 * @returns {string} Turkish label
 */
export const animalTypeLabel = (code) => {
    const map = {
        'SMALL': 'Küçükbaş',
        'KUCUKBAS': 'Küçükbaş',
        'LARGE': 'Büyükbaş',
        'BUYUKBAS': 'Büyükbaş'
    };
    return map[code?.toUpperCase()] || code;
};

/**
 * Convert appointment status code to Turkish label
 * @param {string} code - Status code
 * @returns {string} Turkish label
 */
export const appointmentStatusLabel = (code) => {
    const map = {
        'PENDING': 'Beklemede',
        'APPROVED': 'Onaylandı',
        'REJECTED': 'Reddedildi',
        'CANCELLED': 'İptal Edildi'
    };
    return map[code?.toUpperCase()] || code;
};

/**
 * Convert notification type to Turkish label
 * @param {string} type - Notification type
 * @returns {string} Turkish label
 */
export const notificationTypeLabel = (type) => {
    const map = {
        'NEW_MESSAGE': 'Yeni Mesaj',
        'PRICE_CHANGED': 'Fiyat Değişti',
        'APPOINTMENT_APPROVED': 'Randevu Onaylandı',
        'APPOINTMENT_REJECTED': 'Randevu Reddedildi',
        'APPOINTMENT_CANCELLED': 'Randevu İptal Edildi',
        'NEW_LISTING': 'Yeni İlan',
        'LISTING_UPDATED': 'İlan Güncellendi'
    };
    return map[type?.toUpperCase()] || type;
};
