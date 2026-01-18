import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './ComingSoon.css';

const ComingSoon = () => {
    return (
        <div className="coming-soon-page">
            <Navbar />

            <div className="container coming-soon-content">
                <div className="coming-soon-card">
                    <svg className="icon-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>

                    <h1>Kurban Ortaklığı</h1>
                    <p>Bu özellik yakında eklenecek.</p>

                    <Link to="/" className="btn-home">
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ComingSoon;
