import React from 'react';
import './LoadingState.css';

const LoadingState = ({ message = 'Yükleniyor...', size = 'md', fullPage = false }) => {
    return (
        <div className={`loading-state ${fullPage ? 'loading-state--full' : ''} loading-state--${size}`}>
            <div className="loading-state__spinner">
                <div className="loading-state__ring" />
                <div className="loading-state__ring loading-state__ring--delay" />
                <div className="loading-state__dot" />
            </div>
            {message && <p className="loading-state__text">{message}</p>}
        </div>
    );
};

export default LoadingState;
