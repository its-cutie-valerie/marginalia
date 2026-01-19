import {
    Bookmark,
    BookmarkPlus,
    Trash2,
    Copy,
} from 'lucide-react';
import { Modal } from './Modal';
import { type SavedSnippet } from '../storage';
import { getLanguageName } from '../utils/languageDetection';

interface SnippetsModalProps {
    isOpen: boolean;
    onClose: () => void;
    snippets: SavedSnippet[];
    onLoad: (snippet: SavedSnippet) => void;
    onDelete: (id: string) => void;
    onSaveCurrent: () => void;
    onCopy: (text: string) => void;
    hasCodeToSave: boolean;
}

const iconSize = 16;

export function SnippetsModal({
    isOpen,
    onClose,
    snippets,
    onLoad,
    onDelete,
    onSaveCurrent,
    onCopy,
    hasCodeToSave,
}: SnippetsModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <>
                    <Bookmark size={iconSize} />
                    Saved Snippets
                    {snippets.length > 0 && <span className="badge">{snippets.length}</span>}
                </>
            }
            footer={hasCodeToSave && (
                <button
                    className="btn btn--primary"
                    onClick={() => {
                        onClose();
                        onSaveCurrent();
                    }}
                >
                    <BookmarkPlus size={iconSize} />
                    Save Current Code
                </button>
            )}
        >
            {snippets.length === 0 ? (
                <p className="modal__empty">No saved snippets. Save your favorite code extractions!</p>
            ) : (
                <div className="items-grid">
                    {snippets.map((snippet) => (
                        <div key={snippet.id} className="item-card" onClick={() => onLoad(snippet)}>
                            <div className="item-card__actions">
                                <button
                                    className="item-card__action"
                                    onClick={(e) => { e.stopPropagation(); onCopy(snippet.code); }}
                                    title="Copy code"
                                >
                                    <Copy size={14} />
                                </button>
                                <button
                                    className="item-card__action item-card__action--danger"
                                    onClick={(e) => { e.stopPropagation(); onDelete(snippet.id); }}
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="item-card__name">{snippet.name}</div>
                            <div className="item-card__header">
                                <div className="item-card__meta">
                                    <span className="lang-badge">{getLanguageName(snippet.language)}</span>
                                </div>
                            </div>
                            <div className="item-card__preview">
                                {snippet.code.substring(0, 150)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
}
