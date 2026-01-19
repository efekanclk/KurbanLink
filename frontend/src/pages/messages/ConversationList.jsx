import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { fetchConversations } from '../../api/messages';
import './Messages.css';

const ConversationList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await fetchConversations();
            setConversations(data);
        } catch (err) {
            console.error('Failed to load conversations:', err);
            setError('Konuşmalar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const getCounterparty = (conversation) => {
        // If current user is buyer, show seller email
        // Otherwise show buyer email
        if (user.id === conversation.buyer) {
            return conversation.seller_email;
        }
        return conversation.buyer_email;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now - date;
        const diffInHours = diffInMs / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('tr-TR');
    };

    if (loading) {
        return (
            <div className="page">
                <div className="page__container">
                    <div className="messages-header">
                        <h1>Mesajlar</h1>
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
                    <div className="messages-header">
                        <h1>Mesajlar</h1>
                    </div>
                    <div className="form-card">
                        <p className="error-message">{error}</p>
                        <button onClick={loadConversations} className="submit-btn">Tekrar Dene</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page__container">
                <div className="messages-header">
                    <h1>Mesajlar</h1>
                    <button onClick={() => navigate('/')} className="back-btn">← Geri</button>
                </div>

                {conversations.length === 0 ? (
                    <div className="form-card">
                        <p className="empty-message">Henüz konuşmanız yok.</p>
                    </div>
                ) : (
                    <div className="conversations-list">
                        {conversations.map(conversation => (
                            <div
                                key={conversation.id}
                                className="conversation-card"
                                onClick={() => navigate(`/messages/${conversation.id}`)}
                            >
                                <div className="conversation-info">
                                    <div className="conversation-listing">
                                        <strong>{conversation.listing_details.title || conversation.listing_details.breed || 'İsimsiz İlan'}</strong>
                                        <span className="type-badge">{conversation.listing_details.animal_type}</span>
                                    </div>
                                    <div className="conversation-details">
                                        <p><strong>Fiyat:</strong> {conversation.listing_details.price} TL</p>
                                        <p><strong>Konum:</strong> {conversation.listing_details.location}</p>
                                    </div>
                                    <div className="conversation-counterparty">
                                        <strong>Karşı taraf:</strong> {getCounterparty(conversation)}
                                    </div>
                                    {conversation.last_message && (
                                        <div className="last-message">
                                            <p>{conversation.last_message.content}</p>
                                            <span className="timestamp">{formatDate(conversation.last_message.created_at)}</span>
                                        </div>
                                    )}
                                </div>
                                {conversation.unread_count > 0 && (
                                    <div className="unread-badge">{conversation.unread_count}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConversationList;
