import React from 'react';
import './EmptyState.css';

const EmptyState = ({ icon, message }) => {
    return (
        <div className="empty-state">
            {icon && <div className="empty-icon">{icon}</div>}
            <p className="empty-message">{message}</p>
        </div>
    );
};

export default EmptyState;
