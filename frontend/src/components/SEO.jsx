import { useEffect } from 'react';

/**
 * SEO Component - Updates document meta tags dynamically
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {string} props.keywords - SEO keywords (optional)
 * @param {string} props.image - OG image URL (optional)
 * @param {string} props.url - Canonical URL (optional)
 * @param {string} props.type - OG type (default: 'website')
 */
const SEO = ({
    title,
    description,
    keywords,
    image,
    url,
    type = 'website'
}) => {
    useEffect(() => {
        // Update page title
        if (title) {
            document.title = title === 'KurbanLink' ? title : `${title} | KurbanLink`;
        }

        // Helper function to update or create meta tags
        const updateMeta = (property, content, isProperty = false) => {
            if (!content) return;

            const attribute = isProperty ? 'property' : 'name';
            let element = document.querySelector(`meta[${attribute}="${property}"]`);

            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attribute, property);
                document.head.appendChild(element);
            }

            element.setAttribute('content', content);
        };

        // Update basic meta tags
        updateMeta('description', description);
        updateMeta('keywords', keywords);

        // Update Open Graph tags
        updateMeta('og:title', title, true);
        updateMeta('og:description', description, true);
        updateMeta('og:type', type, true);
        updateMeta('og:image', image, true);
        updateMeta('og:url', url, true);

        // Update Twitter Card tags
        updateMeta('twitter:title', title, true);
        updateMeta('twitter:description', description, true);
        updateMeta('twitter:image', image, true);
        updateMeta('twitter:url', url, true);

        // Update canonical link
        if (url) {
            let canonical = document.querySelector('link[rel="canonical"]');
            if (!canonical) {
                canonical = document.createElement('link');
                canonical.setAttribute('rel', 'canonical');
                document.head.appendChild(canonical);
            }
            canonical.setAttribute('href', url);
        }
    }, [title, description, keywords, image, url, type]);

    return null; // This component doesn't render anything
};

export default SEO;
