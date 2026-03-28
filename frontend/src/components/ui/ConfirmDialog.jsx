import React from 'react';
import { AlertCircle, AlertTriangle, Info, Lock } from 'lucide-react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Tamam', cancelText = 'İptal', type = 'warning', showCancel = true, icon: Icon }) => {
    if (!isOpen) return null;

    const DefaultIcon = type === 'danger' ? AlertCircle :
                        type === 'warning' ? AlertTriangle :
                        type === 'info' ? Info :
                        type === 'primary' ? Lock : null;
    
    const RenderIcon = Icon || DefaultIcon;

    return (
        <>
            <div className="confirm-overlay" onClick={onCancel} />
            <div className="confirm-dialog">
                <div className={`confirm-dialog-header ${type}`}>
                    {RenderIcon && <RenderIcon className="confirm-icon" size={24} />}
                    <h3>{title}</h3>
                </div>
                <div className="confirm-dialog-body">
                    <p>{message}</p>
                </div>
                <div className="confirm-dialog-footer">
                    {showCancel && (
                        <button className="confirm-btn-cancel" onClick={onCancel}>
                            {cancelText}
                        </button>
                    )}
                    <button className={`confirm-btn-confirm ${type}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ConfirmDialog;
