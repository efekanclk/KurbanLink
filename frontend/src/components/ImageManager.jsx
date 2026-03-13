import React, { useState, useEffect } from 'react';
import { compressImage } from '../utils/imageUtils';
import './ImageManager.css';

/**
 * Unified Image Manager Component
 * Handles both existing server images and newly added local images
 * Supports drag-and-drop reordering across all images
 */
const ImageManager = ({
    images = [],           // Array of {kind: 'server'|'local', id, url, file?, order}
    onChange,              // Callback: (newImages) => void
    onDeleteServer,        // Callback: (imageId) => void  
    maxImages = 20
}) => {
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));

        if (files.length === 0) return;

        if (images.length + files.length > maxImages) {
            alert(`En fazla ${maxImages} resim yükleyebilirsiniz`);
            return;
        }

        // Compress all selected files in parallel
        const compressionPromises = files.map(async (file, idx) => {
            try {
                const compressed = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.7 });
                return {
                    kind: 'local',
                    id: `temp-${Date.now()}-${idx}`,
                    file: compressed,
                    url: URL.createObjectURL(compressed),
                    order: images.length + idx
                };
            } catch (err) {
                console.error("Compression failed for", file.name, err);
                return {
                    kind: 'local',
                    id: `temp-${Date.now()}-${idx}`,
                    file,
                    url: URL.createObjectURL(file),
                    order: images.length + idx
                };
            }
        });

        const newImages = await Promise.all(compressionPromises);
        onChange([...images, ...newImages]);
        e.target.value = '';
    };

    const handleFileDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);

        // If dragging an existing image, don't process as file drop
        if (draggedIndex !== null) {
            return;
        }

        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));

        if (files.length === 0) return;

        if (images.length + files.length > maxImages) {
            alert(`En fazla ${maxImages} resim yükleyebilirsiniz`);
            return;
        }

        // Compress all dropped files in parallel
        const compressionPromises = files.map(async (file, idx) => {
            try {
                const compressed = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.7 });
                return {
                    kind: 'local',
                    id: `temp-${Date.now()}-${idx}`,
                    file: compressed,
                    url: URL.createObjectURL(compressed),
                    order: images.length + idx
                };
            } catch (err) {
                console.error("Compression failed for", file.name, err);
                return {
                    kind: 'local',
                    id: `temp-${Date.now()}-${idx}`,
                    file,
                    url: URL.createObjectURL(file),
                    order: images.length + idx
                };
            }
        });

        const newImages = await Promise.all(compressionPromises);
        onChange([...images, ...newImages]);
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedIndex === null) {
            setIsDraggingOver(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget === e.target) {
            setIsDraggingOver(false);
        }
    };

    const handleDragOverDropZone = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newImages = [...images];
        const draggedItem = newImages[draggedIndex];
        newImages.splice(draggedIndex, 1);
        newImages.splice(index, 0, draggedItem);

        // Update order values
        const reordered = newImages.map((img, idx) => ({
            ...img,
            order: idx
        }));

        onChange(reordered);
        setDraggedIndex(index);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDraggedIndex(null);
    };

    const handleRemove = (index) => {
        const image = images[index];

        // If it's a server image, call delete callback
        if (image.kind === 'server') {
            onDeleteServer(image.id);
        } else {
            // Revoke object URL for local images
            URL.revokeObjectURL(image.url);
        }

        // Remove from array and update orders
        const newImages = images
            .filter((_, i) => i !== index)
            .map((img, idx) => ({
                ...img,
                order: idx
            }));

        onChange(newImages);
    };

    return (
        <div
            className={`image-manager ${isDraggingOver ? 'drag-over' : ''}`}
            onDrop={handleFileDrop}
            onDragOver={handleDragOverDropZone}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
        >
            <div className="image-manager__input">
                <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="file-input"
                />
                <label htmlFor="image-upload" className="file-input-label">
                    Ekle ya da sürükle
                </label>
            </div>

            {images.length > 0 && (
                <>
                    <div className="image-manager__info">
                        <span>{images.length}/{maxImages} resim</span>
                    </div>

                    <div className="image-manager__grid">
                        {images.map((image, idx) => (
                            <div
                                key={image.id}
                                className={`image-manager__item ${idx === 0 ? 'is-primary' : ''} ${draggedIndex === idx ? 'dragging' : ''}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDrop={handleDrop}
                            >
                                <img
                                    src={image.url}
                                    alt={`Image ${idx + 1}`}
                                    className="image-manager__thumb"
                                />

                                {idx === 0 && (
                                    <div className="image-manager__badge">Ana Görsel</div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => handleRemove(idx)}
                                    className="image-manager__remove"
                                    aria-label="Resmi kaldır"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ImageManager;
