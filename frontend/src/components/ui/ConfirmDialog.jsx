import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Tamam', cancelText = 'İptal', type = 'warning', showCancel = true }) => {
    if (!isOpen) return null;

    return (
        <>
            <div className="confirm-overlay" onClick={onCancel} />
            <div className="confirm-dialog">
                <div className={`confirm-dialog-header ${type}`}>
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
