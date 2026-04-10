import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { fetchNotifications, markNotificationRead } from '../api/notifications';
import './Notifications.css';
import { MessageCircle, Heart, Calendar, Bell, ArrowLeft } from '../ui/icons';

const Notifications = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await fetchNotifications();
            // Sort by created_at desc, exclude message notifications (shown in floating widget)
            const sorted = data
                .filter(n => n.type !== 'NEW_MESSAGE')
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setNotifications(sorted);
        } catch (err) {
            console.error('Failed to load notifications:', err);
            setError('Bildirimler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification) => {
        // Mark as read if unread
        if (!notification.is_read) {
            try {
                await markNotificationRead(notification.id);
                // Update local state
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
                );
            } catch (err) {
                console.error('Failed to mark as read:', err);
            }
        }

        // Route based on notification type
        try {
            const data = notification.data || {};

            switch (notification.type) {
                case 'NEW_MESSAGE':
                    if (data.conversation_id) {
                        navigate(`/messages/${data.conversation_id}`);
                    } else {
                        navigate('/messages');
                    }
                    break;

                case 'FAVORITED_LISTING':
                case 'LISTING_UPDATED':
                case 'PRICE_CHANGED':
                    if (data.listing_id) {
                        navigate(`/animals/${data.listing_id}`);
                    } else {
                        navigate('/');
                    }
                    break;

                case 'APPOINTMENT_CREATED':
                case 'APPOINTMENT_APPROVED':
                case 'APPOINTMENT_REJECTED':
                case 'APPOINTMENT_CANCELLED':
                    // If user is butcher, go to butcher appointments
                    if (user?.roles?.includes('BUTCHER')) {
                        navigate('/butcher/appointments');
                    } else {
                        navigate('/');
                    }
                    break;

                default:
                    console.warn('Unknown notification type:', notification.type);
                    break;
            }
        } catch (err) {
            console.error('Error routing from notification:', err);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'NEW_MESSAGE':
                return <MessageCircle size={20} />;
            case 'FAVORITED_LISTING':
                return <Heart size={20} />;
            case 'LISTING_UPDATED':
            case 'PRICE_CHANGED':
                return <Bell size={20} />;
            case 'APPOINTMENT_CREATED':
            case 'APPOINTMENT_APPROVED':
            case 'APPOINTMENT_REJECTED':
            case 'APPOINTMENT_CANCELLED':
                return <Calendar size={20} />;
            default:
                return <Bell size={20} />;
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="page__container">
                    <div className="notifications-header">
                        <h1>Bildirimler</h1>
                    </div>
                    <div className="loading">Yükleniyor...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page">
                <div className="page__container">
                    <div className="notifications-header">
                        <h1>Bildirimler</h1>
                    </div>
                    <div className="form-card">
                        <p className="error-message">{error}</p>
                        <button onClick={loadNotifications} className="submit-btn">Tekrar Dene</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page__container">
                <div className="notifications-header">
                    <h1>Bildirimler</h1>
                    <button onClick={() => navigate('/')} className="back-btn">
                        <ArrowLeft size={18} /> Geri
                    </button>
                </div>

                {notifications.length === 0 ? (
                    <div className="form-card">
                        <p className="empty-message">Bildirim yok.</p>
                    </div>
                ) : (
                    <div className="notifications-list">
                        {notifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="notification-icon">{getNotificationIcon(notification.type)}</div>
                                <div className="notification-content">
                                    <div className="notification-message">{notification.message}</div>
                                    <div className="notification-timestamp">
                                        {new Date(notification.created_at).toLocaleString('tr-TR')}
                                    </div>
                                </div>
                                {!notification.is_read && <div className="notification-dot"></div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
