import {
    History as HistoryIcon,
    Trash2,
    Copy,
    Clock,
} from 'lucide-react';
import { Modal } from './Modal';
import { type HistoryItem } from '../storage';
import { getLanguageName } from '../utils/languageDetection';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: HistoryItem[];
    onLoad: (item: HistoryItem) => void;
    onDelete: (id: string) => void;
    onClearAll: () => void;
    onCopy: (text: string) => void;
}

const iconSize = 16;

export function HistoryModal({
    isOpen,
    onClose,
    history,
    onLoad,
    onDelete,
    onClearAll,
    onCopy,
}: HistoryModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <>
                    <HistoryIcon size={iconSize} />
                    Recent Extractions
                    {history.length > 0 && <span className="badge">{history.length}</span>}
                </>
            }
            footer={history.length > 0 && (
                <button className="btn btn--secondary" onClick={onClearAll}>
                    <Trash2 size={iconSize} />
                    Clear All
                </button>
            )}
        >
            {history.length === 0 ? (
                <p className="modal__empty">No history yet. Extract some code to see it here!</p>
            ) : (
                <div className="items-grid">
                    {history.map((item) => (
                        <div key={item.id} className="item-card" onClick={() => onLoad(item)}>
                            <div className="item-card__actions">
                                <button
                                    className="item-card__action"
                                    onClick={(e) => { e.stopPropagation(); onCopy(item.code); }}
                                    title="Copy code"
                                >
                                    <Copy size={14} />
                                </button>
                                <button
                                    className="item-card__action item-card__action--danger"
                                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="item-card__header">
                                <div className="item-card__meta">
                                    <span className="lang-badge">{getLanguageName(item.language)}</span>
                                    <span className="item-card__time">
                                        <Clock size={10} />
                                        {new Date(item.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="item-card__preview">
                                {item.code.substring(0, 150)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
}
