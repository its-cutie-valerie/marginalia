import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Terminal } from 'lucide-react';
import { Modal } from './Modal';
import '../App.css';

interface CodeRunnerProps {
    isOpen: boolean;
    onClose: () => void;
    code: string;
    language: string;
}

interface LogEntry {
    type: 'log' | 'error' | 'warn' | 'info';
    content: string[];
    timestamp: number;
}

export const CodeRunner: React.FC<CodeRunnerProps> = ({
    isOpen,
    onClose,
    code,
    language
}) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom of logs
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const runCode = async () => {
        if (isRunning) return;

        // Check if language is supported
        if (language !== 'javascript' && language !== 'typescript' &&
            language !== 'javascriptreact' && language !== 'typescriptreact') {
            // Should be handled by UI disabling content, but just in case
            return;
        }

        setIsRunning(true);
        setLogs([]); // Clear previous logs

        // Basic delay to show "Running..." state
        await new Promise(resolve => setTimeout(resolve, 100));

        // Capture original console methods
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;

        const capturedLogs: LogEntry[] = [];

        // Helper to safely stringify args
        const formatArgs = (args: any[]) => {
            return args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch {
                        return String(arg);
                    }
                }
                return String(arg);
            });
        };

        const addLog = (type: LogEntry['type'], args: any[]) => {
            const entry: LogEntry = {
                type,
                content: formatArgs(args),
                timestamp: Date.now()
            };
            capturedLogs.push(entry);
            setLogs(prev => [...prev, entry]);
        };

        // Override console methods
        console.log = (...args) => { originalLog(...args); addLog('log', args); };
        console.error = (...args) => { originalError(...args); addLog('error', args); };
        console.warn = (...args) => { originalWarn(...args); addLog('warn', args); };
        console.info = (...args) => { originalInfo(...args); addLog('info', args); };

        try {
            // Check if language is supported
            if (language !== 'javascript' && language !== 'typescript' &&
                language !== 'javascriptreact' && language !== 'typescriptreact') {
                throw new Error(`Execution not supported for ${language}. Only JavaScript/TypeScript are currently supported.`);
            }

            // Simple transpilation for TS (strip types roughly) or just run as JS if valid
            // Since we don't have a full TS compiler in browser here without heavy deps,
            // we'll try to run it directly. Modern browsers handle a lot, but types will fail.
            // For now, we assume the user cleaned up types or it's valid JS.

            // Wrap in async function to allow await
            const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
            const run = new AsyncFunction(code);

            await run();

        } catch (err: any) {
            addLog('error', [err.toString()]);
        } finally {
            // Restore console methods
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            console.info = originalInfo;
            setIsRunning(false);
        }
    };

    // Auto-run when modal opens?
    useEffect(() => {
        if (isOpen) {
            runCode();
        }
    }, [isOpen]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Terminal size={18} />
                    <span>Console Output</span>
                </div>
            }
            size="medium"
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', gap: '8px' }}>
                    <button className="btn btn--secondary" onClick={() => setLogs([])}>
                        <RotateCcw size={16} /> Clear
                    </button>
                    <button className="btn btn--primary" onClick={runCode} disabled={isRunning}>
                        <Play size={16} /> {isRunning ? 'Running...' : 'Run Again'}
                    </button>
                </div>
            }
        >
            <div className="console-window" style={{
                background: '#1e1e1e',
                color: '#d4d4d4',
                padding: '16px',
                borderRadius: '8px',
                height: '400px',
                overflowY: 'auto',
                fontFamily: "'Fira Code', monospace",
                fontSize: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {logs.length === 0 && !isRunning && (
                    <div style={{ color: '#666', fontStyle: 'italic' }}>
                        No output yet...
                    </div>
                )}

                {logs.map((log, i) => (
                    <div key={i} className={`log-entry log-${log.type}`} style={{
                        display: 'flex',
                        gap: '8px',
                        padding: '4px 0',
                        borderBottom: '1px solid #333',
                        color: log.type === 'error' ? '#f87171' :
                            log.type === 'warn' ? '#fbbf24' : '#d4d4d4'
                    }}>
                        <span style={{ color: '#666', minWidth: '20px' }}>&gt;</span>
                        <div style={{ whiteSpace: 'pre-wrap' }}>
                            {log.content.join(' ')}
                        </div>
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>
        </Modal>
    );
};
