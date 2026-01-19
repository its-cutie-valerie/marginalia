import Editor from '@monaco-editor/react';
import {
    FileCode,
    AlignLeft,
    BookmarkPlus,
    Copy,
    Play,
    Share2,
    Code,
} from 'lucide-react';
import {
    SUPPORTED_LANGUAGES,
    getLanguageName,
} from '../utils/languageDetection';
import { format } from 'prettier/standalone';
import * as parserBabel from 'prettier/plugins/babel';
import * as parserEstree from 'prettier/plugins/estree';
import * as parserHtml from 'prettier/plugins/html';
import * as parserMarkdown from 'prettier/plugins/markdown';
import * as parserCss from 'prettier/plugins/postcss';
import { useToast } from '../context/ToastContext';
import { Skeleton } from './Skeleton';

interface CodeEditorProps {
    code: string;
    setCode: (code: string) => void;
    language: string;
    setLanguage: (lang: string) => void;
    theme: string;
    isProcessing?: boolean;
    onSaveSnippet: () => void;
    onCopyToClipboard: () => void;
    onRunCode: () => void;
    onExport: () => void;
}

const iconSize = 16;
const FORMATTABLE_LANGUAGES = ['javascript', 'javascriptreact', 'typescript', 'typescriptreact', 'json', 'css', 'scss', 'less', 'html', 'xml', 'markdown'];
const RUNNABLE_LANGUAGES = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'];

export function CodeEditor({
    code,
    setCode,
    language,
    setLanguage,
    theme,
    isProcessing = false,
    onSaveSnippet,
    onCopyToClipboard,
    onRunCode,
    onExport,
}: CodeEditorProps) {
    const { showToast } = useToast();

    const handleFormat = async () => {
        if (!code) return;

        const languageParsers: Record<string, string> = {
            javascript: 'babel',
            javascriptreact: 'babel',
            typescript: 'babel-ts',
            typescriptreact: 'babel-ts',
            json: 'json',
            css: 'css',
            scss: 'scss',
            less: 'less',
            html: 'html',
            xml: 'html',
            markdown: 'markdown',
        };

        const parser = languageParsers[language];

        if (!parser) {
            showToast(`Formatting not supported for ${getLanguageName(language)}`, 'error');
            return;
        }

        try {
            const formatted = await format(code, {
                parser,
                plugins: [
                    parserBabel,
                    parserEstree,
                    parserHtml,
                    parserMarkdown,
                    parserCss,
                ] as any[],
                printWidth: 80,
                tabWidth: 2,
                useTabs: false,
                semi: true,
                singleQuote: true,
            });
            setCode(formatted);
            showToast('Code formatted!', 'success');
        } catch (error) {
            console.error('Format error:', error);
            showToast('Could not format code. Check for syntax errors.', 'error');
        }
    };

    const lineCount = code.split('\n').length;
    const charCount = code.length;

    if (!code && !isProcessing) {
        return (
            <div className="panel">
                <div className="panel__header">
                    <h2 className="panel__title">
                        <Code size={iconSize} />
                        Code Editor
                    </h2>
                </div>
                <div className="panel__content">
                    <div className="empty-state">
                        <Code size={iconSize} />
                        <p className="empty-state__text">
                            Upload an image to extract and edit code
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="panel">
            <div className="panel__header">
                <h2 className="panel__title">
                    <FileCode size={iconSize} />
                    <span className="lang-badge">{getLanguageName(language)}</span>
                </h2>
                <div className="editor-toolbar">
                    <select
                        className="language-select"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        {SUPPORTED_LANGUAGES.map((lang) => (
                            <option key={lang} value={lang}>
                                {getLanguageName(lang)}
                            </option>
                        ))}
                    </select>

                    <div className="tooltip-wrapper">
                        <button
                            className={`btn btn--secondary ${!FORMATTABLE_LANGUAGES.includes(language) ? 'btn--disabled' : ''}`}
                            onClick={handleFormat}
                            disabled={!FORMATTABLE_LANGUAGES.includes(language)}
                            style={!FORMATTABLE_LANGUAGES.includes(language) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                            title={FORMATTABLE_LANGUAGES.includes(language) ? "Format Code" : `Formatting not available for ${getLanguageName(language)}`}
                        >
                            <AlignLeft size={iconSize} />
                        </button>
                    </div>

                    <button
                        className="btn btn--secondary"
                        onClick={onSaveSnippet}
                        title="Save as snippet"
                    >
                        <BookmarkPlus size={iconSize} />
                    </button>
                    <button
                        className="btn btn--primary"
                        onClick={onCopyToClipboard}
                        title="Copy to clipboard"
                    >
                        <Copy size={iconSize} />
                    </button>
                    <div className="toolbar-divider" style={{ width: 1, height: 24, background: 'var(--border-color)', margin: '0 4px' }} />
                    <button
                        className="btn btn--secondary"
                        onClick={onRunCode}
                        title="Run Code (JS/TS only)"
                        disabled={!RUNNABLE_LANGUAGES.includes(language)}
                        style={{
                            opacity: !RUNNABLE_LANGUAGES.includes(language) ? 0.5 : 1,
                            cursor: !RUNNABLE_LANGUAGES.includes(language) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Play size={iconSize} />
                    </button>
                    <button
                        className="btn btn--secondary"
                        onClick={onExport}
                        title="Export Image"
                    >
                        <Share2 size={iconSize} />
                    </button>
                </div>
            </div>
            <div className="panel__content">
                <div className="editor-wrapper">
                    <div className="editor-container">
                        {isProcessing ? (
                            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <Skeleton height={24} width="60%" borderRadius={4} />
                                <Skeleton height={24} width="80%" borderRadius={4} />
                                <Skeleton height={24} width="40%" borderRadius={4} />
                                <Skeleton height={24} width="70%" borderRadius={4} />
                                <Skeleton height={24} width="50%" borderRadius={4} />
                            </div>
                        ) : (
                            <Editor
                                height="100%"
                                language={language}
                                value={code}
                                onChange={(value) => setCode(value || '')}
                                theme={theme === 'light' ? 'light' : 'vs-dark'}
                                options={{
                                    fontSize: 14,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                                    fontLigatures: true,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    padding: { top: 16, bottom: 16 },
                                    lineNumbers: 'on',
                                    renderLineHighlight: 'line',
                                    wordWrap: 'on',
                                    automaticLayout: true,
                                    tabSize: 2,
                                    cursorBlinking: 'smooth',
                                    cursorSmoothCaretAnimation: 'on',
                                    smoothScrolling: true,
                                }}
                            />
                        )}
                    </div>
                    <div className="panel__header" style={{ borderTop: '1px solid var(--border-color)', borderBottom: 'none' }}>
                        <div className="stats">
                            <span className="stat">
                                Lines: <span className="stat__value">{lineCount}</span>
                            </span>
                            <span className="stat">
                                Characters: <span className="stat__value">{charCount}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
