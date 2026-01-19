import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchConversations, fetchConversationMessages, sendMessage as sendMessageAPI, markAllRead } from '../api/messages';
import './FloatingMessages.css';

const FloatingMessages = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('list'); // 'list' or 'thread'
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (isOpen && view === 'list' && conversations.length === 0) {
            loadConversations();
        }
    }, [isOpen, view]);

    const loadConversations = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchConversations();
            setConversations(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            setError('Mesajlar yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const openConversation = async (conversation) => {
        setSelectedConversation(conversation);
        setView('thread');
        setLoading(true);
        setError(null);

        try {
            const data = await fetchConversationMessages(conversation.id);
            setMessages(Array.isArray(data) ? data : data.results || []);

            // Mark as read
            if (conversation.unread_count > 0) {
                await markAllRead(conversation.id);
                // Update conversation list
                setConversations(prev => prev.map(c =>
                    c.id === conversation.id ? { ...c, unread_count: 0 } : c
                ));
            }
        } catch (err) {
            setError('Mesajlar yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!messageInput.trim() || sending) return;

        setSending(true);
        try {
            const newMessage = await sendMessageAPI(selectedConversation.id, messageInput.trim());
            setMessages(prev => [...prev, newMessage]);
            setMessageInput('');
        } catch (err) {
            setError('Mesaj gönderilemedi.');
        } finally {
            setSending(false);
        }
    };

    const handleBack = () => {
        setView('list');
        setSelectedConversation(null);
        setMessages([]);
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    const getCounterparty = (conversation) => {
        return conversation.other_user?.username || conversation.other_user?.email || 'Kullanıcı';
    };

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

    return (
        <>
            {/* Floating Button */}
            <button
                className="floating-messages-btn"
                onClick={() => setIsOpen(!isOpen)}
                title="Mesajlar"
            >
                💬 Mesajlar
                {totalUnread > 0 && (
                    <span className="unread-badge">{totalUnread}</span>
                )}
            </button>

            {/* Messages Panel */}
            {isOpen && (
                <div className="messages-panel">
                    {view === 'list' ? (
                        <>
                            {/* Conversation List */}
                            <div className="panel-header">
                                <h3>Mesajlar</h3>
                                <button onClick={() => setIsOpen(false)} className="panel-close-btn">✕</button>
                            </div>

                            <div className="panel-body">
                                {loading && <div className="panel-loading">Yükleniyor...</div>}
                                {error && <div className="panel-error">{error}</div>}

                                {!loading && !error && conversations.length === 0 && (
                                    <div className="panel-empty">Henüz mesajınız yok</div>
                                )}

                                {!loading && conversations.map(conv => (
                                    <div
                                        key={conv.id}
                                        className="conversation-item"
                                        onClick={() => openConversation(conv)}
                                    >
                                        <div className="conv-info">
                                            <div className="conv-name">{getCounterparty(conv)}</div>
                                            <div className="conv-preview">{conv.last_message || 'Mesaj yok'}</div>
                                        </div>
                                        {conv.unread_count > 0 && (
                                            <span className="conv-unread-badge">{conv.unread_count}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Message Thread */}
                            <div className="panel-header">
                                <button onClick={handleBack} className="panel-back-btn">← Geri</button>
                                <h3>{getCounterparty(selectedConversation)}</h3>
                                <button onClick={() => setIsOpen(false)} className="panel-close-btn">✕</button>
                            </div>

                            <div className="panel-body messages-body">
                                {loading && <div className="panel-loading">Yükleniyor...</div>}
                                {error && <div className="panel-error">{error}</div>}

                                {!loading && messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`message-bubble ${msg.is_mine ? 'mine' : 'theirs'}`}
                                    >
                                        <div className="bubble-content">{msg.content}</div>
                                        <div className="bubble-time">{formatTime(msg.created_at)}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="panel-footer">
                                <input
                                    type="text"
                                    className="message-input"
                                    placeholder="Mesaj yaz..."
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    disabled={sending}
                                />
                                <button
                                    className="send-btn"
                                    onClick={sendMessage}
                                    disabled={!messageInput.trim() || sending}
                                >
                                    {sending ? '...' : 'Gönder'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default FloatingMessages;
