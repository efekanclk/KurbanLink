import React from 'react';
import './LoadingState.css';

const LoadingState = ({ message = 'Yükleniyor...' }) => {
    return (
        <div className="loading-state">
            <div className="spinner"></div>
            <p>{message}</p>
        </div>
    );
};

export default LoadingState;
