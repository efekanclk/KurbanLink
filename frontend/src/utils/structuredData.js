/**
 * Generate JSON-LD structured data for a listing
 * @param {Object} listing - Animal listing object
 * @returns {string} JSON-LD script content
 */
export const generateListingStructuredData = (listing) => {
    const structuredData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": listing.title || listing.breed,
        "description": listing.description || `${listing.animal_type} - ${listing.breed}`,
        "image": listing.images?.[0]?.image_url || "",
        "offers": {
            "@type": "Offer",
            "url": `https://kurbanlink.com/animals/${listing.id}`,
            "priceCurrency": "TRY",
            "price": listing.price,
            "availability": listing.is_active ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": {
                "@type": "Person",
                "name": listing.seller_username || "KurbanLink Satıcı"
            }
        },
        "category": listing.animal_type,
        "brand": {
            "@type": "Brand",
            "name": "KurbanLink"
        }
    };

    return JSON.stringify(structuredData);
};

/**
 * Generate JSON-LD for organization/website with SearchAction
 */
export const generateOrganizationStructuredData = () => {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "KurbanLink",
        "url": "https://kurbanlink.com",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://kurbanlink.com/?search={search_term_string}"
            },
            "query-input": "required name=search_term_string"
        }
    };

    return JSON.stringify(structuredData);
};

/**
 * Generate Breadcrumb structured data
 * @param {Array} items - Array of { name, item } objects
 */
export const generateBreadcrumbStructuredData = (items) => {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.item
        }))
    };

    return JSON.stringify(structuredData);
};

/**
 * Generate LocalBusiness structured data for a butcher
 * @param {Object} butcher - Butcher profile object
 */
export const generateButcherStructuredData = (butcher) => {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": butcher.butcher_name,
        "image": butcher.profile_image_url || "https://kurbanlink.com/default-butcher.png",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": butcher.city,
            "addressCountry": "TR"
        },
        "description": `${butcher.city} bölgesinde ${butcher.experience_years} yıllık tecrübeli kasap hizmeti.`,
        "url": `https://kurbanlink.com/butchers/${butcher.id}`,
        "priceRange": butcher.price_range || "$$"
    };

    return JSON.stringify(structuredData);
};
