import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const NavigateToConversation = () => {
    const { conversationId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (conversationId) {
            navigate(`/messages?conversation=${conversationId}`, { replace: true });
        } else {
            navigate('/messages', { replace: true });
        }
    }, [conversationId, navigate]);

    return null;
};

export default NavigateToConversation;
