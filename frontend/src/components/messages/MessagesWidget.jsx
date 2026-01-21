import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { fetchInbox, fetchConversationMessages, fetchGroupMessages, sendMessage, sendGroupMessage, markAllRead, markGroupAllRead } from '../../api/messages';
import { MessageCircle, Maximize2, X, ArrowLeft, Send } from '../../ui/icons';
import './MessagesWidget.css';

const MessagesWidget = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const widgetRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Calculate total unread count
    const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);

    // Load conversations when panel opens
    useEffect(() => {
        if (isOpen && conversations.length === 0) {
            loadConversations();
        }
    }, [isOpen]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (widgetRef.current && !widgetRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = async () => {
        setLoading(true);
        try {
            const data = await fetchInbox(); // Use unified inbox
            setConversations(data);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (conversation) => {
        setLoading(true);
        try {
            let data;
            if (conversation.type === 'GROUP') {
                data = await fetchGroupMessages(conversation.id);
                await markGroupAllRead(conversation.id);
            } else {
                data = await fetchConversationMessages(conversation.id);
                await markAllRead(conversation.id);
            }
            setMessages(data);

            // Update local unread count
            setConversations(prev =>
                prev.map(conv =>
                    conv.id === conversation.id && conv.type === conversation.type
                        ? { ...conv, unread_count: 0 }
                        : conv
                )
            );
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConversationClick = (conversation) => {
        setSelectedConversation(conversation);
        loadMessages(conversation);
    };

    const handleBack = () => {
        setSelectedConversation(null);
        setMessages([]);
    };

    const handleExpand = () => {
        const query = selectedConversation
            ? selectedConversation.type === 'GROUP'
                ? `?group=${selectedConversation.id}`
                : `?conversation=${selectedConversation.id}`
            : '';
        navigate(`/messages${query}`);
        setIsOpen(false);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedConversation) return;

        setSending(true);
        try {
            let newMessage;
            if (selectedConversation.type === 'GROUP') {
                newMessage = await sendGroupMessage(selectedConversation.id, messageInput.trim());
            } else {
                newMessage = await sendMessage(selectedConversation.id, messageInput.trim());
            }
            setMessages(prev => [...prev, newMessage]);
            setMessageInput('');

            // Update last message in conversations list
            setConversations(prev =>
                prev.map(conv =>
                    conv.id === selectedConversation.id && conv.type === selectedConversation.type
                        ? { ...conv, last_message: { ...newMessage, created_at: newMessage.created_at } }
                        : conv
                )
            );
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    const getConversationTitle = (conversation) => {
        return conversation.title;
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Az önce';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}dk`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}s`;
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    if (!user) return null;

    // Hide widget on full messages page
    if (location.pathname === '/messages') return null;

    return (
        <div className="messages-widget" ref={widgetRef}>
            {/* Floating Button (Closed State) */}
            {!isOpen && (
                <button
                    className="messages-widget__button"
                    onClick={() => setIsOpen(true)}
                    title="Mesajlar"
                >
                    <MessageCircle size={20} />
                    <span>Mesajlar</span>
                    {totalUnread > 0 && (
                        <span className="messages-widget__badge">{totalUnread > 9 ? '9+' : totalUnread}</span>
                    )}
                </button>
            )}

            {/* Panel (Open State) */}
            {isOpen && (
                <div className="messages-widget__panel">
                    {/* Header */}
                    <div className="messages-widget__header">
                        {selectedConversation && (
                            <button className="messages-widget__back" onClick={handleBack}>
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h3 className="messages-widget__title">
                            {selectedConversation ? getConversationTitle(selectedConversation) : 'Mesajlar'}
                        </h3>
                        <div className="messages-widget__actions">
                            <button className="messages-widget__action" onClick={handleExpand} title="Genişlet">
                                <Maximize2 size={18} />
                            </button>
                            <button className="messages-widget__action" onClick={() => setIsOpen(false)} title="Kapat">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="messages-widget__body">
                        {!selectedConversation ? (
                            // Conversation List
                            <div className="messages-widget__conversations">
                                {loading ? (
                                    <div className="messages-widget__loading">Yükleniyor...</div>
                                ) : conversations.length === 0 ? (
                                    <div className="messages-widget__empty">Henüz mesajınız yok</div>
                                ) : (
                                    conversations.map(conv => (
                                        <div
                                            key={`${conv.type}-${conv.id}`}
                                            className={`messages-widget__conversation ${conv.unread_count > 0 ? 'unread' : ''}`}
                                            onClick={() => handleConversationClick(conv)}
                                        >
                                            <div className="messages-widget__conversation-avatar">
                                                {conv.type === 'GROUP' ? '👥' : getConversationTitle(conv)?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div className="messages-widget__conversation-content">
                                                <div className="messages-widget__conversation-header">
                                                    <span className="messages-widget__conversation-name">
                                                        {getConversationTitle(conv)}
                                                    </span>
                                                    {conv.last_message && (
                                                        <span className="messages-widget__conversation-time">
                                                            {formatTime(conv.last_message.created_at)}
                                                        </span>
                                                    )}
                                                </div>
                                                {conv.last_message && (
                                                    <div className="messages-widget__conversation-preview">
                                                        {conv.last_message.content}
                                                    </div>
                                                )}
                                            </div>
                                            {conv.unread_count > 0 && (
                                                <span className="messages-widget__conversation-unread">{conv.unread_count}</span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            // Thread View
                            <div className="messages-widget__thread">
                                <div className="messages-widget__messages">
                                    {loading ? (
                                        <div className="messages-widget__loading">Yükleniyor...</div>
                                    ) : (
                                        messages.map(msg => (
                                            <div
                                                key={msg.id}
                                                className={`messages-widget__message ${msg.sender === user.id ? 'mine' : 'theirs'}`}
                                            >
                                                {selectedConversation.type === 'GROUP' && msg.sender !== user.id && (
                                                    <div className="messages-widget__message-sender-info">
                                                        {msg.sender_profile_image ? (
                                                            <img
                                                                src={msg.sender_profile_image}
                                                                alt={msg.sender_username}
                                                                className="messages-widget__sender-avatar"
                                                            />
                                                        ) : (
                                                            <div className="messages-widget__sender-avatar-placeholder">
                                                                {msg.sender_username?.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="messages-widget__message-content-wrapper">
                                                    {selectedConversation.type === 'GROUP' && msg.sender !== user.id && (
                                                        <span className="messages-widget__sender-name">{msg.sender_username}</span>
                                                    )}
                                                    <div className="messages-widget__message-bubble">
                                                        {msg.content}
                                                    </div>
                                                    <div className="messages-widget__message-time">
                                                        {formatTime(msg.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <form className="messages-widget__input" onSubmit={handleSendMessage}>
                                    <input
                                        type="text"
                                        placeholder="Mesajınızı yazın..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        disabled={sending}
                                    />
                                    <button type="submit" disabled={!messageInput.trim() || sending}>
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessagesWidget;
