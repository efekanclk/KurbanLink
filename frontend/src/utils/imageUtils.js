/**
 * Utility to compress and resize images before uploading.
 * This helps prevent 413 Request Entity Too Large errors on servers like Nginx.
 */

/**
 * Compresses an image file.
 * @param {File} file - The original image file.
 * @param {Object} options - Compression options.
 * @param {number} options.maxWidth - Maximum width in pixels (default: 1200).
 * @param {number} options.maxHeight - Maximum height in pixels (default: 1200).
 * @param {number} options.quality - Image quality from 0 to 1 (default: 0.7).
 * @returns {Promise<File>} - A promise that resolves to the compressed File object.
 */
export const compressImage = (file, { maxWidth = 1200, maxHeight = 1200, quality = 0.7 } = {}) => {
    return new Promise((resolve, reject) => {
        // If it's not an image, just return the original file
        if (!file.type.startsWith('image/')) {
            return resolve(file);
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            return reject(new Error('Canvas toBlob failed'));
                        }
                        // Create a new file from the blob
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg', // Always convert to JPEG for better compression
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};
