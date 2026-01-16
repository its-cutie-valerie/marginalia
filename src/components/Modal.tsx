import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import '../App.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    size?: 'small' | 'medium' | 'large';
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    className = '',
    size = 'medium'
}) => {
    const [shouldRender, setShouldRender] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
        } else if (shouldRender) {
            setIsClosing(true);
            // Wait for animation to finish (250ms matches CSS)
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsClosing(false);
            }, 250);
            return () => clearTimeout(timer);
        }
    }, [isOpen, shouldRender]);

    if (!shouldRender) return null;

    return (
        <div
            className={`modal-overlay ${isClosing ? 'modal-overlay--closing' : ''}`}
            onClick={onClose}
        >
            <div
                className={`modal modal--${size} ${className} ${isClosing ? 'modal--closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal__header">
                    <h3 className="modal__title">{title}</h3>
                    <button className="btn btn--ghost" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>
                <div className="modal__content">
                    {children}
                </div>
                {footer && (
                    <div className="modal__footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
