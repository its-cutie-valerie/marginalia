/**
 * Local storage utilities for history and saved snippets
 */

export interface HistoryItem {
    id: string;
    code: string;
    language: string;
    timestamp: number;
    preview: string; // First 100 chars
}

export interface SavedSnippet {
    id: string;
    name: string;
    code: string;
    language: string;
    timestamp: number;
}

const HISTORY_KEY = 'code-ocr-history';
const SNIPPETS_KEY = 'code-ocr-snippets';
const MAX_HISTORY = 20;

// Generate unique ID
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// History functions
export function getHistory(): HistoryItem[] {
    try {
        const data = localStorage.getItem(HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function addToHistory(code: string, language: string): HistoryItem {
    const history = getHistory();
    const item: HistoryItem = {
        id: generateId(),
        code,
        language,
        timestamp: Date.now(),
        preview: code.substring(0, 100).replace(/\n/g, ' '),
    };

    // Add to beginning, limit to MAX_HISTORY
    const newHistory = [item, ...history].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));

    return item;
}

export function removeFromHistory(id: string): void {
    const history = getHistory().filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
    localStorage.removeItem(HISTORY_KEY);
}

// Saved snippets functions
export function getSavedSnippets(): SavedSnippet[] {
    try {
        const data = localStorage.getItem(SNIPPETS_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function saveSnippet(name: string, code: string, language: string): SavedSnippet {
    const snippets = getSavedSnippets();
    const snippet: SavedSnippet = {
        id: generateId(),
        name,
        code,
        language,
        timestamp: Date.now(),
    };

    const newSnippets = [snippet, ...snippets];
    localStorage.setItem(SNIPPETS_KEY, JSON.stringify(newSnippets));

    return snippet;
}

export function updateSnippet(id: string, updates: Partial<Omit<SavedSnippet, 'id'>>): void {
    const snippets = getSavedSnippets().map(s =>
        s.id === id ? { ...s, ...updates } : s
    );
    localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
}

export function removeSnippet(id: string): void {
    const snippets = getSavedSnippets().filter(s => s.id !== id);
    localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
}

// Format timestamp for display
export function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return new Date(timestamp).toLocaleDateString();
}
