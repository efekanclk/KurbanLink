import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications, markNotificationRead, markAllRead } from '../api/notifications';
import { useAuth } from '../auth/AuthContext';
import './NotificationDropdown.css';
import { Bell, MessageCircle, Heart, Calendar, CheckCircle2, X } from '../ui/icons';

const NotificationDropdown = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Initial load and polling
    useEffect(() => {
        if (user) {
            loadNotifications();
            // Optional: Poll every 30s
            const interval = setInterval(loadNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await fetchNotifications();
            const all = Array.isArray(data) ? data : data.results || [];
            // Exclude message & favorite notifications — messages are shown in the floating widget
            const notifs = all.filter(n => n.type !== 'FAVORITED_LISTING' && n.type !== 'NEW_MESSAGE');
            setNotifications(notifs.slice(0, 5));
            const count = notifs.filter(n => !n.is_read).length;
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to load notifications', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        // Mark as read if needed
        if (!notification.is_read) {
            try {
                await markNotificationRead(notification.id);
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
                );
            } catch (error) {
                console.error('Failed to mark read', error);
            }
        }

        // Navigate based on type
        setIsOpen(false);
        switch (notification.type) {
            case 'NEW_MESSAGE':
                // Assuming related_object_id is conversation_id or similar
                navigate('/messages');
                break;
            case 'FAVORITED_LISTING':
                if (notification.related_object_id) {
                    navigate(`/animals/${notification.related_object_id}`);
                }
                break;
            case 'APPOINTMENT_REQUESTED':
            case 'APPOINTMENT_APPROVED':
            case 'APPOINTMENT_REJECTED':
            case 'APPOINTMENT_CANCELLED':
                navigate(user.roles.includes('BUTCHER') ? '/butcher/appointments' : '/butcher/appointments');
                break;
            default:
                // Fallback
                navigate('/notifications');
        }
    };

    const handleMarkAllRead = async (e) => {
        e.stopPropagation();
        try {
            await markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all read', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'NEW_MESSAGE': return <MessageCircle size={16} />;
            case 'FAVORITED_LISTING': return <Heart size={16} />;
            case 'APPOINTMENT_REQUESTED': return <Calendar size={16} />;
            case 'APPOINTMENT_APPROVED': return <CheckCircle2 size={16} />;
            case 'APPOINTMENT_REJECTED': return <X size={16} />;
            case 'APPOINTMENT_CANCELLED': return <X size={16} />;
            default: return <Bell size={16} />;
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Az önce';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}dk önce`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}s önce`;
        return date.toLocaleDateString('tr-TR');
    };

    return (
        <div className="notification-dropdown-container" ref={dropdownRef}>
            <button
                className={`notification-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Bildirimler"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="dropdown-header">
                        <h3>Bildirimler</h3>
                        {unreadCount > 0 && (
                            <button className="mark-read-btn" onClick={handleMarkAllRead}>
                                Tümünü okundu işaretle
                            </button>
                        )}
                    </div>

                    <div className="dropdown-body">
                        {loading ? (
                            <div className="dropdown-empty">Yükleniyor...</div>
                        ) : notifications.length === 0 ? (
                            <div className="dropdown-empty">Bildiriminiz yok</div>
                        ) : (
                            <ul className="notification-list">
                                {notifications.map(notification => (
                                    <li
                                        key={notification.id}
                                        className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="notification-icon">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="notification-content">
                                            <p className="notification-text">{notification.message}</p>
                                            <span className="notification-time">{formatTime(notification.created_at)}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="dropdown-footer">
                        <button className="view-all-btn" onClick={() => {
                            setIsOpen(false);
                            navigate('/notifications');
                        }}>
                            Tümünü Gör
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
