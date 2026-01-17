import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Download, Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Modal } from './Modal';
import '../App.css'; // Ensure we have access to styles

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    code: string;
    language: string;
}

const GRADIENTS = {
    'purple-blue': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'sunset': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
    'ocean': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'forest': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'midnight': 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    'mango': 'linear-gradient(135deg, #ffe259 0%, #ffa751 100%)',
};

export const ExportModal: React.FC<ExportModalProps> = ({
    isOpen,
    onClose,
    code,
    language
}) => {
    const previewRef = useRef<HTMLDivElement>(null);
    const [background, setBackground] = useState<keyof typeof GRADIENTS>('purple-blue');
    const [isExporting, setIsExporting] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleDownload = async () => {
        if (!previewRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(previewRef.current, {
                useCORS: true,
                scale: 2, // Retina quality
                backgroundColor: null,
            });

            const link = document.createElement('a');
            link.download = `code-snippet-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleCopyImage = async () => {
        if (!previewRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(previewRef.current, {
                scale: 2,
                backgroundColor: null,
            });

            canvas.toBlob(async (blob) => {
                if (!blob) return;
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                } catch (err) {
                    console.error('Failed to copy image to clipboard', err);
                }
            });
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Export Image"
            size="large"
            footer={
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', width: '100%' }}>
                    <div className="gradient-selector" style={{ marginRight: 'auto', display: 'flex', gap: '0.5rem' }}>
                        {Object.entries(GRADIENTS).map(([name, gradient]) => (
                            <button
                                key={name}
                                onClick={() => setBackground(name as any)}
                                style={{
                                    background: gradient,
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    border: background === name ? '2px solid white' : 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                                aria-label={`Select ${name} background`}
                            />
                        ))}
                    </div>
                    <button className="btn btn--secondary" onClick={handleCopyImage} disabled={isExporting}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy Image'}
                    </button>
                    <button className="btn btn--primary" onClick={handleDownload} disabled={isExporting}>
                        <Download size={16} />
                        {isExporting ? 'Exporting...' : 'Download PNG'}
                    </button>
                </div>
            }
        >
            <div className="export-preview-container" style={{
                display: 'flex',
                // Remove justifyContent: 'center' to prevent left clipping on overflow
                alignItems: 'flex-start',
                padding: '2rem',
                background: '#1a1a1a',
                borderRadius: '8px',
                overflow: 'auto'
            }}>
                <div
                    ref={previewRef}
                    className="export-frame"
                    style={{
                        background: GRADIENTS[background],
                        padding: '3rem',
                        borderRadius: '12px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        width: 'max-content',
                        minWidth: '500px',
                        flexShrink: 0,
                        margin: 'auto', // Center when small, left-align when overflowing
                    }}
                >
                    <div className="code-window" style={{
                        background: '#1e1e1e',
                        borderRadius: '8px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                        overflow: 'hidden',       // Maintain border radius
                        fontFamily: "'Fira Code', 'Consolas', monospace",
                    }}>
                        {/* Window Controls */}
                        <div className="window-header" style={{
                            padding: '12px 16px',
                            background: '#252526',
                            display: 'flex',
                            gap: '8px',
                            borderBottom: '1px solid #333'
                        }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
                            <div style={{ marginLeft: 'auto', color: '#888', fontSize: '12px', opacity: 0.7 }}>
                                {language}
                            </div>
                        </div>

                        {/* Code Content */}
                        <div className="window-content" style={{ padding: '0' }}>
                            <SyntaxHighlighter
                                language={language}
                                style={vscDarkPlus}
                                customStyle={{
                                    margin: 0,
                                    padding: '24px',
                                    background: 'transparent',
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    fontFamily: "'Fira Code', 'Consolas', monospace",
                                    // Use 'pre' to respect original formatting and allow width expansion
                                    whiteSpace: 'pre',
                                    overflow: 'visible' // Ensure no internal scrollbars
                                }}
                            >
                                {code}
                            </SyntaxHighlighter>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
