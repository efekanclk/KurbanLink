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
  markGroupAllRead,
  deleteMessage,
  deleteGroupMessage,
} from '../../api/messages';
import { Send, User as UserIcon, Users as UsersIcon, ArrowLeft, Reply, X } from '../../ui/icons';
import './MessagesPage.css';

const MessagesPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // { msg, x, y }
  const [deleteModal, setDeleteModal] = useState(null); // msg to delete
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const inputRef = useRef(null);
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
    
    // Poll for inbox updates every 10 seconds
    const inboxInterval = setInterval(() => {
      loadConversations(false); // Pass false to avoid flickering loading states
    }, 10000);
    
    return () => clearInterval(inboxInterval);
  }, []);

  // Polling for new messages in selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    // Poll for new messages every 3 seconds
    const messagesInterval = setInterval(() => {
      refreshMessages(selectedConversation);
    }, 3000);

    return () => clearInterval(messagesInterval);
  }, [selectedConversation]);

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

  // Handle focus management
  useEffect(() => {
    if (!sending && selectedConversation) {
      inputRef.current?.focus();
    }
  }, [sending, selectedConversation]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
        const container = messagesEndRef.current.parentNode;
        container.scrollTop = container.scrollHeight;
    }
  };

  const loadConversations = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await fetchInbox();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const refreshMessages = async (conversation) => {
    if (!conversation) return;
    try {
      let data;
      if (conversation.type === 'GROUP') {
        data = await fetchGroupMessages(conversation.id);
      } else {
        data = await fetchConversationMessages(conversation.id);
      }
      
      // Update if message count changed OR if any existing message status changed
      setMessages(prev => {
        if (!Array.isArray(data)) return prev;
        
        const hasChanges = prev.length !== data.length || 
                          prev.some((msg, idx) => msg?.is_read !== data[idx]?.is_read);
                          
        if (hasChanges) {
          // If we are refreshing and there's a new message for US, mark as read
          if (conversation.type === 'GROUP') {
             // markGroupAllRead(conversation.id);
          } else {
             const hasNewTheirs = data.length > prev.length && 
                                data[data.length-1]?.sender !== user?.id;
             if (hasNewTheirs && user && conversation.id) markAllRead(conversation.id);
          }
          return data;
        }
        return prev;
      });
    } catch (error) {
      console.error('Failed to refresh messages:', error);
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
      setMessages(Array.isArray(data) ? data : []);

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
    setReplyingTo(null);

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
    const content = messageInput.trim();
    if (!content || !selectedConversation) return;

    // Create optimistic temporary message
    const tempId = `temp-${Date.now()}`;
    const parentMsg = replyingTo;
    const optimisticMessage = {
      id: tempId,
      content: content,
      created_at: new Date().toISOString(),
      sender: user?.id || user,
      sender_username: user?.username,
      parent_message_details: parentMsg ? {
        id: parentMsg.id,
        content: parentMsg.content,
        sender_username: parentMsg.sender_username
      } : null
    };

    // 1. Instantly update messages UI
    setMessages(prev => [...prev, optimisticMessage]);
    setMessageInput('');
    setReplyingTo(null);

    // 2. Instantly update the side conversation list
    setConversations(prev =>
      prev.map(conv =>
        conv.id === selectedConversation.id && conv.type === selectedConversation.type
          ? {
            ...conv,
            last_message: {
              content: optimisticMessage.content,
              created_at: optimisticMessage.created_at,
              sender_username: user.username
            },
            updated_at: optimisticMessage.created_at
          }
          : conv
      ).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    );

    setSending(true);
    sendingRef.current = true;
    try {
      let newMessage;
      if (selectedConversation.type === 'GROUP') {
        newMessage = await sendGroupMessage(selectedConversation.id, content, parentMsg?.id);
      } else {
        newMessage = await sendMessage(selectedConversation.id, content, parentMsg?.id);
      }

      // Replace the temporary message with the real one from the server
      setMessages(prev => prev.map(msg => msg.id === tempId ? { ...newMessage, is_read: false } : msg));

    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    } finally {
      setSending(false);
      sendingRef.current = false;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getDayLabel = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === now.toDateString()) return 'Bugün';
    if (date.toDateString() === yesterday.toDateString()) return 'Dün';
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleMessageContextMenu = (e, msg) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({ msg, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleReply = (msg) => {
    setReplyingTo(msg);
    closeContextMenu();
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCopy = (msg) => {
    navigator.clipboard.writeText(msg.content).catch(() => {});
    closeContextMenu();
  };

  const handleDelete = (msg) => {
    closeContextMenu();
    setDeleteModal(msg);
  };

  const handleDeleteForEveryone = async () => {
    const msg = deleteModal;
    setDeleteModal(null);
    // Optimistically mark as deleted
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_deleted: true, content: '' } : m));
    try {
      const updated = selectedConversation?.type === 'GROUP'
        ? await deleteGroupMessage(msg.id, true)
        : await deleteMessage(msg.id, true);
      // Backend returns the updated message with is_deleted=true
      if (updated) {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, ...updated } : m));
      }
    } catch (err) {
      console.error('Delete for everyone failed:', err);
      // Rollback on failure
      setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
    }
  };

  const handleDeleteForMe = async () => {
    const msg = deleteModal;
    setDeleteModal(null);
    // Optimistically remove from view
    setMessages(prev => prev.filter(m => m.id !== msg.id));
    try {
      if (selectedConversation?.type === 'GROUP') {
        await deleteGroupMessage(msg.id, false);
      } else {
        await deleteMessage(msg.id, false);
      }
    } catch (err) {
      console.error('Delete for me failed:', err);
      // No rollback for "Delete for Me" as it's a personal preference/cleanup
      // but we could reload messages if it was critical.
    }
  };

  return (
    <div className="messages-page" onClick={closeContextMenu}>
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
                  (() => {
                    let lastDayLabel = null;
                    return messages.map(msg => {
                      const senderId = typeof msg.sender === 'object' ? msg.sender?.id : msg.sender;
                      const isMe = user?.id && senderId === user.id;
                      const dayLabel = getDayLabel(msg.created_at);
                      const showDaySep = dayLabel !== lastDayLabel;
                      if (showDaySep) lastDayLabel = dayLabel;

                      return (
                        <React.Fragment key={msg.id}>
                          {showDaySep && (
                            <div className="day-separator"><span>{dayLabel}</span></div>
                          )}
                          <div
                            className={`message ${isMe ? 'mine' : 'theirs'}`}
                            onContextMenu={(e) => handleMessageContextMenu(e, msg)}
                          >
                            {selectedConversation.type === 'GROUP' && !isMe && (
                              <div className="message__sender-info">
                                {msg.sender_profile_image ? (
                                  <img src={msg.sender_profile_image} alt={msg.sender_username} className="message__sender-avatar" />
                                ) : (
                                  <div className="message__sender-avatar-placeholder">
                                    {msg.sender_username?.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="message__sender-name">{msg.sender_username}</span>
                              </div>
                            )}
                            <div
                              className="message__bubble"
                              onTouchStart={(e) => {
                                const timer = setTimeout(() => handleMessageContextMenu(e.touches[0], msg), 500);
                                e.currentTarget._touchTimer = timer;
                              }}
                              onTouchEnd={(e) => clearTimeout(e.currentTarget._touchTimer)}
                            >
                              {msg.is_deleted ? (
                                <div className="message__deleted">
                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                                  </svg>
                                  <span>{isMe ? 'Bu mesajı sildiniz.' : 'Bu mesaj silindi.'}</span>
                                  <span className="bubble-time" style={{marginLeft:'auto'}}>{formatTime(msg.created_at)}</span>
                                </div>
                              ) : (
                                <>
                                  {msg.parent_message_details && (
                                    <div className="message__reply-quote">
                                      <div className="reply-quote__sender">{msg.parent_message_details.sender_username}</div>
                                      <div className="reply-quote__content">{msg.parent_message_details.content}</div>
                                    </div>
                                  )}
                                  <div className="message__text">{msg.content}</div>
                                  <div className="bubble-time-status">
                                    <span className="bubble-time">{formatTime(msg.created_at)}</span>
                                    {isMe && (
                                      <span className={`tick-status ${msg.is_read ? 'tick-read' : 'tick-sent'}`}>
                                        {msg.id?.toString()?.startsWith('temp-') ? (
                                          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><circle cx="8" cy="8" r="3" opacity="0.4"/></svg>
                                        ) : msg.is_read ? (
                                          <svg viewBox="0 0 24 10" width="20" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="1,5 5,9 13,1"/>
                                            <polyline points="8,5 12,9 20,1"/>
                                          </svg>
                                        ) : (
                                          <svg viewBox="0 0 14 10" width="16" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="1,5 5,9 13,1"/>
                                          </svg>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    });
                  })()
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="messages-main__footer-container">
                {replyingTo && (
                  <div className="reply-preview">
                    <div className="reply-preview__content">
                      <div className="reply-preview__sender">{replyingTo.sender_username}</div>
                      <div className="reply-preview__text">{replyingTo.content}</div>
                    </div>
                    <button className="reply-preview__cancel" onClick={() => setReplyingTo(null)}>
                      <X size={16} />
                    </button>
                  </div>
                )}
                <form className="messages-main__footer" onSubmit={handleSendMessage}>
                  <input
                    ref={inputRef}
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
              </div>
            </>
          )}
          {/* Context Menu */}
          {contextMenu && (
            <div
              className="msg-context-menu"
              style={{ top: contextMenu.y, left: contextMenu.x }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="msg-context-item" onClick={() => handleReply(contextMenu.msg)}>
                <Reply size={15} />
                <span>Yanıtla</span>
              </button>
              <button className="msg-context-item" onClick={() => handleCopy(contextMenu.msg)}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <span>Kopyala</span>
              </button>
              <div className="msg-context-divider" />
              <button className="msg-context-item msg-context-delete" onClick={() => handleDelete(contextMenu.msg)}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
                <span>Sil</span>
              </button>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteModal && (
            <div className="delete-modal-overlay" onClick={() => setDeleteModal(null)}>
              <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
                <p className="delete-modal__title">Mesaj silinsin mi?</p>
                
                {/* Herkesten sil only for sender (isMe) */}
                {(typeof deleteModal.sender === 'object' ? deleteModal.sender?.id === user?.id : deleteModal.sender === user?.id) && (
                  <button className="delete-modal__btn delete-modal__btn--everyone" onClick={handleDeleteForEveryone}>
                    Herkesten sil
                  </button>
                )}
                
                <button className="delete-modal__btn delete-modal__btn--me" onClick={handleDeleteForMe}>
                  Benden sil
                </button>
                <button className="delete-modal__btn delete-modal__btn--cancel" onClick={() => setDeleteModal(null)}>
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
