import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
    fetchPartnershipDetail,
    requestJoin,
    fetchJoinRequests,
    approveRequest,
    rejectRequest,
    leavePartnership,
    closePartnership,
    fetchMembers
} from '../../api/partnerships';
import { Users, UserPlus, UserMinus, X, Check, MessageCircle } from '../../ui/icons';
import './PartnershipDetail.css';

const PartnershipDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [partnership, setPartnership] = useState(null);
    const [members, setMembers] = useState([]);
    const [joinRequests, setJoinRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadPartnership();
    }, [id]);

    useEffect(() => {
        if (partnership?.user_is_creator) {
            loadJoinRequests();
        }
        if (partnership?.user_is_member) {
            loadMembers();
        }
    }, [partnership?.user_is_creator, partnership?.user_is_member]);

    const loadPartnership = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchPartnershipDetail(id);
            setPartnership(data);
        } catch (err) {
            setError('Ortaklık yüklenemedi');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadMembers = async () => {
        try {
            const data = await fetchMembers(id);
            setMembers(data);
        } catch (err) {
            console.error('Failed to load members:', err);
        }
    };

    const loadJoinRequests = async () => {
        try {
            const data = await fetchJoinRequests(id);
            setJoinRequests(data);
        } catch (err) {
            console.error('Failed to load join requests:', err);
        }
    };

    const handleRequestJoin = async () => {
        setActionLoading(true);
        try {
            await requestJoin(id);
            showToast('Katılım isteği gönderildi');
            await loadPartnership();
        } catch (err) {
            const message = err.response?.data?.error || 'İstek gönderilemedi';
            showToast(message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async (requestId) => {
        setActionLoading(true);
        try {
            await approveRequest(id, requestId);
            showToast('Katılım isteği onaylandı');
            await loadJoinRequests();
            await loadPartnership();
        } catch (err) {
            showToast('İstek onaylanamadı', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (requestId) => {
        setActionLoading(true);
        try {
            await rejectRequest(id, requestId);
            showToast('Katılım isteği reddedildi');
            await loadJoinRequests();
        } catch (err) {
            showToast('İstek reddedilemedi', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeave = async () => {
        if (!window.confirm('Ortaklıktan ayrılmak istediğinizden emin misiniz?')) return;

        setActionLoading(true);
        try {
            await leavePartnership(id);
            showToast('Ortaklıktan ayrıldınız');
            await loadPartnership();
            navigate('/partnerships');
        } catch (err) {
            const message = err.response?.data?.error || 'Ayrılamadınız';
            showToast(message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleClose = async () => {
        if (!window.confirm('Ortaklığı kapatmak istediğinizden emin misiniz?')) return;

        setActionLoading(true);
        try {
            await closePartnership(id);
            showToast('Ortaklık kapatıldı');
            await loadPartnership();
        } catch (err) {
            showToast('Kapatılamadı', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenGroupChat = () => {
        // Navigate to messages with group conversation
        navigate(`/messages?group=${partnership.id}`);
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    if (loading) {
        return <div className="partnership-detail__loading">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="partnership-detail__error">{error}</div>;
    }

    if (!partnership) {
        return <div className="partnership-detail__error">Ortaklık bulunamadı</div>;
    }

    const canJoin = !partnership.user_is_member && !partnership.user_is_creator && !partnership.is_full && partnership.status === 'OPEN';
    const hasPendingRequest = partnership.user_request_status === 'PENDING';
    const isRejected = partnership.user_request_status === 'REJECTED';

    return (
        <div className="partnership-detail">
            {toast && (
                <div className={`partnership-detail__toast partnership-detail__toast--${toast.type}`}>
                    {toast.message}
                </div>
            )}

            <div className="partnership-detail__container">
                {/* Header */}
                <div className="partnership-detail__header">
                    <h1>{partnership.city} Ortaklığı</h1>
                    <div className="partnership-detail__capacity">
                        <Users size={20} />
                        <span>{partnership.member_count}/{partnership.person_count} Katılımcı</span>
                    </div>
                    {partnership.is_full && (
                        <span className="partnership-detail__badge partnership-detail__badge--full">
                            Kontenjan Dolu
                        </span>
                    )}
                    {partnership.status === 'CLOSED' && (
                        <span className="partnership-detail__badge partnership-detail__badge--closed">
                            Kapalı
                        </span>
                    )}
                </div>

                {/* Description */}
                {partnership.description && (
                    <div className="partnership-detail__description">
                        <p>{partnership.description}</p>
                    </div>
                )}

                {/* Actions based on user role */}
                <div className="partnership-detail__actions">
                    {partnership.user_is_creator && (
                        <>
                            <button
                                className="btn btn--danger"
                                onClick={handleClose}
                                disabled={actionLoading || partnership.status === 'CLOSED'}
                            >
                                <X size={18} />
                                İlanı Kapat
                            </button>
                            <button
                                className="btn btn--primary"
                                onClick={handleOpenGroupChat}
                            >
                                <MessageCircle size={18} />
                                Grup Sohbeti
                            </button>
                        </>
                    )}

                    {canJoin && (
                        <button
                            className={`btn ${isRejected ? 'btn--danger' : 'btn--primary'}`}
                            onClick={handleRequestJoin}
                            disabled={actionLoading || hasPendingRequest || isRejected}
                            title={isRejected ? 'Bu ortaklık için başvurunuz reddedildi' : ''}
                            style={isRejected ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                        >
                            <UserPlus size={18} />
                            {hasPendingRequest ? 'İstek Gönderildi' : isRejected ? 'İstek Reddedildi' : 'Ortaklığa Katıl'}
                        </button>
                    )}

                    {partnership.user_is_member && !partnership.user_is_creator && (
                        <>
                            <button
                                className="btn btn--danger"
                                onClick={handleLeave}
                                disabled={actionLoading}
                            >
                                <UserMinus size={18} />
                                Ayrıl
                            </button>
                            <button
                                className="btn btn--primary"
                                onClick={handleOpenGroupChat}
                            >
                                <MessageCircle size={18} />
                                Grup Sohbeti
                            </button>
                        </>
                    )}
                </div>

                {/* Join Requests (Creator Only) */}
                {partnership.user_is_creator && joinRequests.length > 0 && (
                    <div className="partnership-detail__section">
                        <h2>Katılım İstekleri ({joinRequests.length})</h2>
                        <div className="partnership-detail__requests">
                            {joinRequests.map(request => (
                                <div key={request.id} className="partnership-detail__request">
                                    <div className="partnership-detail__request-info">
                                        <strong>{request.user_username}</strong>
                                        <span className="partnership-detail__request-date">
                                            {new Date(request.created_at).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>
                                    <div className="partnership-detail__request-actions">
                                        <button
                                            className="btn btn--sm btn--success"
                                            onClick={() => handleApprove(request.id)}
                                            disabled={actionLoading}
                                        >
                                            <Check size={16} />
                                            Onayla
                                        </button>
                                        <button
                                            className="btn btn--sm btn--danger"
                                            onClick={() => handleReject(request.id)}
                                            disabled={actionLoading}
                                        >
                                            <X size={16} />
                                            Reddet
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Members List (Members Only) */}
                {partnership.user_is_member && members.length > 0 && (
                    <div className="partnership-detail__section">
                        <h2>Üyeler ({members.length})</h2>
                        <div className="partnership-detail__members">
                            {members.map(member => (
                                <div key={member.id} className="partnership-detail__member">
                                    <div className="partnership-detail__member-avatar">
                                        {member.profile_photo_url ? (
                                            <img src={member.profile_photo_url} alt={member.username} />
                                        ) : (
                                            member.username?.charAt(0)?.toUpperCase()
                                        )}
                                    </div>
                                    <div className="partnership-detail__member-info">
                                        <strong>{member.username}</strong>
                                        {member.city && <span>{member.city}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PartnershipDetail;
