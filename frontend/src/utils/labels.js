/**
 * Label mappings for enum values (Turkish).
 */

export const animalTypeLabel = (type) => {
    const map = {
        SMALL: 'Küçükbaş',
        BUYUKBAS: 'Büyükbaş',
        KUCUKBAS: 'Küçükbaş',
    };
    return map[type] || type;
};



export const genderLabel = (gender) => {
    const map = {
        ERKEK: 'Erkek',
        DISI: 'Dişi',
    };
    return map[gender] || '-';
};

export const partnershipStatusLabel = (status) => {
    const map = {
        OPEN: 'Açık',
        CLOSED: 'Kapandı',
    };
    return map[status] || status;
};

export const roleLabel = (role) => {
    const map = {
        USER: 'Kullanıcı',
        BUTCHER: 'Kasap',
    };
    return map[role] || role;
};

export const formatTRY = (amount) => {
    if (amount == null) return '-';
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};
