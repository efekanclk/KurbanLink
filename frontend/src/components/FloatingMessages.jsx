import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchConversations, fetchConversationMessages, sendMessage as sendMessageAPI, markAllRead } from '../api/messages';
import { useAuth } from '../auth/AuthContext';
import './FloatingMessages.css';
import { MessageCircle, ArrowLeft } from '../ui/icons';

const FloatingMessages = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('list'); // 'list' or 'thread'
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sending, setSending] = useState(false);
    const inputRef = React.useRef(null);
    const messagesEndRef = React.useRef(null);

    // Handle focus management
    useEffect(() => {
        if (!sending && (view === 'thread' || isOpen)) {
            inputRef.current?.focus();
        }
    }, [sending, view, isOpen]);

    // Auto scroll to bottom
    useEffect(() => {
        if (view === 'thread') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

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
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });
        if (isToday) return timeStr;
        return `${date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} ${timeStr}`;
    };

    // ... lines skipped ...

    const getCounterparty = (conversation) => {
        if (!user) return 'Kullanıcı';

        // If I am the buyer, show seller name
        if (user.id === conversation.buyer) {
            return conversation.seller_username || (conversation.seller_email ? conversation.seller_email.split('@')[0] : 'Satıcı');
        }
        // If I am the seller, show buyer name
        if (user.id === conversation.seller) {
            return conversation.buyer_username || (conversation.buyer_email ? conversation.buyer_email.split('@')[0] : 'Alıcı');
        }

        // Fallback (shouldn't happen if involved)
        const otherUsername = conversation.other_user?.username;
        const otherEmail = conversation.other_user?.email;
        return otherUsername || (otherEmail ? otherEmail.split('@')[0] : 'Kullanıcı');
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
                <MessageCircle size={20} style={{ marginRight: '0.5rem' }} />
                Mesajlar
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
                                            <div className="conv-preview">{typeof conv.last_message === 'string' ? conv.last_message : conv.last_message?.content || 'Mesaj yok'}</div>
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
                                <button onClick={handleBack} className="panel-back-btn">
                                    <ArrowLeft size={16} /> Geri
                                </button>
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
                                <div ref={messagesEndRef} />
                            </div>

                             <div className="panel-footer">
                                <input
                                    ref={inputRef}
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
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                                    </svg>
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
