import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
  fetchInbox,
  fetchConversationMessages,
  fetchGroupMessages,
  sendMessage,
  sendGroupMessage,
  markAllRead,
  markGroupAllRead
} from '../../api/messages';
import { Send, User as UserIcon, Users as UsersIcon, ArrowLeft } from '../../ui/icons';
import './MessagesPage.css';

const MessagesPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Handle URL params
  useEffect(() => {
    if (conversations.length > 0) {
      const groupId = searchParams.get('group');
      const conversationId = searchParams.get('conversation');

      let targetConv = null;

      if (groupId) {
        // Find group conversation by partnership ID or conversation ID (fallback)
        targetConv = conversations.find(c =>
          c.type === 'GROUP' && (c.partnership_id === parseInt(groupId) || c.id === parseInt(groupId))
        );
      } else if (conversationId) {
        // Find direct conversation
        targetConv = conversations.find(c =>
          c.type === 'DIRECT' && c.id === parseInt(conversationId)
        );
      }

      if (targetConv && targetConv.id !== selectedConversation?.id) {
        handleConversationSelect(targetConv, false);
      }
    }
  }, [searchParams, conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    setLoading(true);
    try {
      const data = await fetchInbox();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversation) => {
    setMessagesLoading(true);
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
      setMessagesLoading(false);
    }
  };

  const handleConversationSelect = (conversation, updateUrl = true) => {
    setSelectedConversation(conversation);
    loadMessages(conversation);

    if (updateUrl) {
      const params = new URLSearchParams();
      if (conversation.type === 'GROUP') {
        params.set('group', conversation.id);
      } else {
        params.set('conversation', conversation.id);
      }
      setSearchParams(params);
    }
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setMessages([]);
    setSearchParams({});
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
            ? {
              ...conv,
              last_message: {
                content: newMessage.content,
                created_at: newMessage.created_at,
                sender_username: user.username
              },
              updated_at: newMessage.created_at
            }
            : conv
        ).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      );
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
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

  return (
    <div className="messages-page">
      <div className="messages-container">
        {/* Left Column - Conversation List */}
        <div className={`messages-sidebar ${isMobileView && selectedConversation ? 'hidden' : ''}`}>
          <div className="messages-sidebar__header">
            <button onClick={() => navigate('/')} className="back-btn" style={{ background: 'transparent', color: '#64748b', border: 'none', marginRight: '0.5rem', padding: '0.25rem' }}>
              <ArrowLeft size={24} />
            </button>
            <h2>Mesajlar</h2>
          </div>
          <div className="messages-sidebar__list">
            {loading && conversations.length === 0 ? (
              <div className="messages-sidebar__loading">Yükleniyor...</div>
            ) : conversations.length === 0 ? (
              <div className="messages-sidebar__empty">Henüz mesajınız yok</div>
            ) : (
              conversations.map(conv => (
                <div
                  key={`${conv.type}-${conv.id}`}
                  className={`messages-sidebar__item ${selectedConversation?.id === conv.id && selectedConversation?.type === conv.type ? 'active' : ''} ${conv.unread_count > 0 ? 'unread' : ''}`}
                  onClick={() => handleConversationSelect(conv)}
                >
                  <div className="messages-sidebar__avatar">
                    {conv.type === 'GROUP' ? <UsersIcon size={20} /> : (conv.title?.charAt(0)?.toUpperCase() || <UserIcon size={20} />)}
                  </div>
                  <div className="messages-sidebar__content">
                    <div className="messages-sidebar__header-row">
                      <span className="messages-sidebar__name">
                        {conv.title}
                      </span>
                      {conv.last_message && (
                        <span className="messages-sidebar__time">
                          {formatTime(conv.updated_at)}
                        </span>
                      )}
                    </div>
                    {conv.last_message && (
                      <div className="messages-sidebar__preview">
                        {conv.type === 'GROUP' && conv.last_message.sender_username && (
                          <span className="sender-prefix">{conv.last_message.sender_username}: </span>
                        )}
                        {conv.last_message.content}
                      </div>
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="messages-sidebar__unread">{conv.unread_count}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Thread View */}
        <div className="messages-main">
          {!selectedConversation ? (
            <div className="messages-main__empty">
              <h3>Bir konuşma seçin</h3>
              <p>Mesajlaşmaya başlamak için sol taraftan bir konuşma seçin</p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="messages-main__header">
                {isMobileView && (
                  <button className="messages-back-btn" onClick={handleBackToList}>
                    <ArrowLeft size={20} />
                  </button>
                )}
                <div className="messages-main__header-avatar">
                  {selectedConversation.type === 'GROUP' ? <UsersIcon size={24} /> : (selectedConversation.title?.charAt(0)?.toUpperCase() || <UserIcon size={24} />)}
                </div>
                <h3>{selectedConversation.title}</h3>
              </div>

              {/* Messages */}
              <div className="messages-main__body">
                {messagesLoading ? (
                  <div className="messages-main__loading">Yükleniyor...</div>
                ) : (
                  messages.map(msg => {
                    const isMine = (msg.sender === user.id) || (msg.sender?.id === user.id) || (selectedConversation.type === 'DIRECT' && !msg.sender_username); // simplistic check
                    // Adjust sender check based on API response structure
                    // For unified structure, direct messages might have sender as ID, group as Object or ID.
                    // The backend serializers:
                    // MessageSerializer: sender is serializer (object)
                    // GroupMessageSerializer: sender is serializer (object)
                    const senderId = typeof msg.sender === 'object' ? msg.sender.id : msg.sender;
                    const isMe = senderId === user.id;

                    return (
                      <div
                        key={msg.id}
                        className={`message ${isMe ? 'mine' : 'theirs'}`}
                      >
                        {selectedConversation.type === 'GROUP' && !isMe && (
                          <div className="message__sender-info">
                            {msg.sender_profile_image ? (
                              <img
                                src={msg.sender_profile_image}
                                alt={msg.sender_username}
                                className="message__sender-avatar"
                              />
                            ) : (
                              <div className="message__sender-avatar-placeholder">
                                {msg.sender_username?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="message__sender-name-content">
                              <span className="message__sender-name">{msg.sender_username}</span>
                            </div>
                          </div>
                        )}
                        <div className="message__bubble">
                          {msg.content}
                        </div>
                        <div className="message__time">
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form className="messages-main__footer" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Mesajınızı yazın..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" disabled={!messageInput.trim() || sending}>
                  <Send size={20} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
