import { useState, useEffect, useCallback, useRef } from 'react';
import { createWorker, type Worker } from 'tesseract.js';
import Editor from '@monaco-editor/react';
import {
  processImage as applyImageProcessing,
  DEFAULT_SETTINGS,
  PRESETS,
  type ImageSettings,
  type PresetName,
} from './imageProcessing';
import {
  getHistory,
  addToHistory,
  removeFromHistory,
  clearHistory,
  getSavedSnippets,
  saveSnippet,
  removeSnippet,
  formatTimeAgo,
  type HistoryItem,
  type SavedSnippet,
} from './storage';
import {
  Upload,
  ImageIcon,
  Code,
  Copy,
  Check,
  Trash2,
  ClipboardPaste,
  AlertCircle,
  Heart,
  Github,
  Coffee,
  Sun,
  Contrast,
  Zap,
  ZoomIn,
  RotateCcw,
  FileCode,
  SlidersHorizontal,
  Wand2,
  Plus,
  History,
  Bookmark,
  BookmarkPlus,
  Clock,
  Palette,
  Moon,
  Waves,
  TreePine,
  Flower2,
  Sunset,
  Ghost,
  Snowflake,
  Terminal,
  Box,
  AlignLeft,
} from 'lucide-react';
import './App.css';
import { Modal } from './components/Modal';

import { format } from 'prettier/standalone';
import * as parserBabel from 'prettier/plugins/babel';
import * as parserEstree from 'prettier/plugins/estree';
import * as parserHtml from 'prettier/plugins/html';
import * as parserMarkdown from 'prettier/plugins/markdown';
import * as parserCss from 'prettier/plugins/postcss';

// Language detection patterns with weights (higher = more specific)
const LANGUAGE_PATTERNS: Record<string, { patterns: RegExp[]; weight: number }> = {
  // TSX/JSX must be checked BEFORE HTML
  typescriptreact: {
    patterns: [
      /import\s+.*from\s+['"]react['"]/,
      /import\s+\{.*useState.*\}/,
      /import\s+\{.*useEffect.*\}/,
      /<\w+\s+className=/,
      /:\s*React\.(FC|Component)/,
      /useState<\w+>/,
      /useCallback|useMemo|useRef|useContext/,
      /return\s*\(\s*</,
      /export\s+(default\s+)?function\s+\w+/,
    ],
    weight: 4,
  },
  javascriptreact: {
    patterns: [
      /import\s+React/,
      /from\s+['"]react['"]/,
      /<\w+\s+className=/,
      /React\.createElement/,
      /const\s+\[\w+,\s*set\w+\]\s*=\s*useState/,
    ],
    weight: 3,
  },
  typescript: {
    patterns: [
      /:\s*(string|number|boolean|any|void|never|unknown)\b/,
      /interface\s+\w+\s*\{/,
      /type\s+\w+\s*=/,
      /<\w+>\s*\(/,
      /as\s+(string|number|boolean|const)/,
      /:\s*\w+\[\]/,
      /enum\s+\w+/,
    ],
    weight: 2,
  },
  python: {
    patterns: [
      /^(import|from)\s+\w+/m,
      /def\s+\w+\s*\([^)]*\)\s*:/,
      /class\s+\w+.*:/,
      /print\s*\(/,
      /self\.\w+/,
      /__init__|__name__/,
      /if\s+__name__\s*==\s*['"]__main__['"]/,
    ],
    weight: 2,
  },
  javascript: {
    patterns: [
      /\bconst\s+\w+\s*=/,
      /\blet\s+\w+\s*=/,
      /\bvar\s+\w+\s*=/,
      /=>\s*[{(]/,
      /function\s+\w+\s*\(/,
      /\bconsole\.(log|error|warn)/,
      /require\s*\(/,
      /module\.exports/,
      /export\s+(default\s+)?/,
    ],
    weight: 1,
  },
  java: {
    patterns: [
      /public\s+(class|static|void)/,
      /private\s+\w+/,
      /System\.out\.print/,
      /new\s+\w+\(/,
      /extends\s+\w+/,
      /implements\s+\w+/,
      /@Override/,
    ],
    weight: 2,
  },
  cpp: {
    patterns: [
      /#include\s*<\w+>/,
      /std::/,
      /cout\s*<</,
      /cin\s*>>/,
      /int\s+main\s*\(/,
      /nullptr/,
      /using\s+namespace/,
    ],
    weight: 2,
  },
  c: {
    patterns: [
      /#include\s*<\w+\.h>/,
      /printf\s*\(/,
      /scanf\s*\(/,
      /int\s+main\s*\(/,
      /malloc\s*\(/,
      /free\s*\(/,
    ],
    weight: 2,
  },
  csharp: {
    patterns: [
      /using\s+System/,
      /namespace\s+\w+/,
      /public\s+class\s+\w+/,
      /Console\.(WriteLine|ReadLine)/,
      /async\s+Task/,
    ],
    weight: 2,
  },
  rust: {
    patterns: [
      /fn\s+\w+/,
      /let\s+(mut\s+)?\w+/,
      /impl\s+\w+/,
      /pub\s+(fn|struct|enum)/,
      /println!\s*\(/,
      /use\s+\w+::/,
    ],
    weight: 2,
  },
  go: {
    patterns: [
      /package\s+\w+/,
      /func\s+\w+/,
      /import\s+\(/,
      /fmt\.(Print|Println)/,
      /:=\s*/,
    ],
    weight: 2,
  },
  html: {
    patterns: [
      /<!DOCTYPE\s+html/i,
      /<html\b/i,
      /<head\b/i,
      /<body\b/i,
      /class="[^"]*"/,
    ],
    weight: 1, // Lower weight so TSX/JSX are preferred
  },
  css: {
    patterns: [
      /\.\w+\s*\{/,
      /#\w+\s*\{/,
      /:\s*(flex|grid|block|none)/,
      /(margin|padding|border|background)\s*:/,
      /@media\s+/,
    ],
    weight: 2,
  },
  sql: {
    patterns: [
      /\b(SELECT|INSERT|UPDATE|DELETE)\s+/i,
      /\bFROM\s+\w+/i,
      /\bWHERE\s+/i,
      /CREATE\s+(TABLE|INDEX|DATABASE)/i,
    ],
    weight: 2,
  },
  json: {
    patterns: [
      /^\s*\{[\s\S]*"[^"]+"\s*:/,
      /^\s*\[/,
    ],
    weight: 1,
  },
  yaml: {
    patterns: [
      /^\w+:\s*$/m,
      /^\s+-\s+\w+/m,
    ],
    weight: 1,
  },
  ruby: {
    patterns: [
      /def\s+\w+/,
      /\bend$/m,
      /puts\s+/,
      /\.each\s+do/,
    ],
    weight: 2,
  },
  php: {
    patterns: [
      /<\?php/,
      /\$\w+\s*=/,
      /echo\s+/,
    ],
    weight: 2,
  },
  swift: {
    patterns: [
      /func\s+\w+\s*\(/,
      /var\s+\w+:\s*\w+/,
      /let\s+\w+:\s*\w+/,
      /import\s+(Foundation|UIKit|SwiftUI)/,
    ],
    weight: 2,
  },
  kotlin: {
    patterns: [
      /fun\s+\w+/,
      /val\s+\w+/,
      /var\s+\w+\s*:/,
    ],
    weight: 2,
  },
  shell: {
    patterns: [
      /^#!/,
      /\becho\s+/,
      /\$\([^)]+\)/,
      /fi$/m,
    ],
    weight: 2,
  },
  markdown: {
    patterns: [
      /^#{1,6}\s+\w+/m,
      /\*\*[^*]+\*\*/,
      /\[.*\]\(.*\)/,
      /```\w*/,
    ],
    weight: 1,
  },
  dockerfile: {
    patterns: [
      /^FROM\s+\w+/m,
      /^RUN\s+/m,
      /^CMD\s+/m,
      /^EXPOSE\s+\d+/m,
      /^WORKDIR\s+/m,
    ],
    weight: 2,
  },
  scala: {
    patterns: [
      /def\s+\w+\s*\[/,
      /val\s+\w+\s*:/,
      /object\s+\w+/,
      /case\s+class/,
      /trait\s+\w+/,
    ],
    weight: 2,
  },
  haskell: {
    patterns: [
      /::\s*\w+(\s*->\s*\w+)+/,
      /\w+\s*=\s*do\s*$/m,
      /import\s+qualified/,
      /module\s+\w+/,
      /where$/m,
    ],
    weight: 2,
  },
  dart: {
    patterns: [
      /void\s+main\s*\(\)/,
      /@override/,
      /Widget\s+build/,
      /import\s+['"]package:/,
      /class\s+\w+\s+extends\s+(State)?less?Widget/,
    ],
    weight: 2,
  },
  vue: {
    patterns: [
      /<template>/,
      /<script\s+setup/,
      /defineComponent/,
      /ref\s*\(/,
      /computed\s*\(/,
    ],
    weight: 3,
  },
  svelte: {
    patterns: [
      /<script\s+(lang="ts")?\s*>/,
      /\$:\s*\{/,
      /<style\s+lang=/,
      /export\s+let\s+\w+/,
      /on:\w+/,
    ],
    weight: 3,
  },
  lua: {
    patterns: [
      /function\s+\w+\s*\(/,
      /local\s+\w+\s*=/,
      /end$/m,
      /require\s*\(['"]/,
      /nil\b/,
    ],
    weight: 2,
  },
  r: {
    patterns: [
      /<-\s*/,
      /library\s*\(/,
      /function\s*\([^)]*\)\s*\{/,
      /data\.frame/,
      /ggplot\s*\(/,
    ],
    weight: 2,
  },
  perl: {
    patterns: [
      /^use\s+strict/m,
      /\$\w+\s*=/,
      /my\s+\$/,
      /sub\s+\w+\s*\{/,
      /=~\s*[sm]?\//,
    ],
    weight: 2,
  },
  elixir: {
    patterns: [
      /defmodule\s+\w+/,
      /def\s+\w+\s*do/,
      /\|>\s*\w+/,
      /@spec\s+\w+/,
      /fn\s+\w+\s*->/,
    ],
    weight: 2,
  },
  clojure: {
    patterns: [
      /\(defn?\s+\w+/,
      /\(ns\s+\w+/,
      /\(let\s+\[/,
      /\(if\s+/,
      /\(fn\s+\[/,
    ],
    weight: 2,
  },
};

const SUPPORTED_LANGUAGES = [
  'plaintext', 'python', 'javascript', 'typescript', 'typescriptreact', 'javascriptreact',
  'java', 'cpp', 'c', 'csharp', 'rust', 'go', 'swift', 'kotlin',
  'html', 'css', 'scss', 'less', 'sql', 'json', 'yaml', 'xml', 'markdown',
  'ruby', 'php', 'perl', 'lua', 'r', 'shell', 'powershell', 'dockerfile',
  'scala', 'haskell', 'clojure', 'elixir', 'dart', 'groovy',
  'vue', 'svelte', 'graphql', 'toml', 'ini', 'makefile',
];

// Language display names
const LANGUAGE_NAMES: Record<string, string> = {
  plaintext: 'Plain Text',
  typescriptreact: 'TSX',
  javascriptreact: 'JSX',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
  cpp: 'C++',
  csharp: 'C#',
  dockerfile: 'Dockerfile',
  powershell: 'PowerShell',
  vue: 'Vue',
  svelte: 'Svelte',
  graphql: 'GraphQL',
  toml: 'TOML',
  makefile: 'Makefile',
  objectivec: 'Objective-C',
  scss: 'SCSS',
  less: 'LESS',
  ini: 'INI',
};

function detectLanguage(code: string): string {
  const scores: Record<string, number> = {};

  for (const [lang, { patterns, weight }] of Object.entries(LANGUAGE_PATTERNS)) {
    let score = 0;
    for (const pattern of patterns) {
      const matches = code.match(new RegExp(pattern, 'gm'));
      if (matches) {
        score += matches.length * weight;
      }
    }
    scores[lang] = score;
  }

  const detected = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])[0];

  return detected ? detected[0] : 'plaintext';
}

function getLanguageName(lang: string): string {
  return LANGUAGE_NAMES[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
}

// Icon size helper
const iconSize = 16;

// Theme types and options
// Theme types and options
type ThemeName =
  | 'dark' | 'light' | 'ocean' | 'forest' | 'rose' | 'sunset'
  | 'dracula' | 'nord' | 'monokai' | 'solarized-dark' | 'gruvbox' | 'synthwave';

const THEMES: { name: ThemeName; label: string; icon: React.ReactNode; color: string }[] = [
  // Standard Themes
  { name: 'dark', label: 'Dark', icon: <Moon size={16} />, color: '#8b5cf6' },
  { name: 'light', label: 'Light', icon: <Sun size={16} />, color: '#7c3aed' },
  { name: 'ocean', label: 'Ocean', icon: <Waves size={16} />, color: '#0ea5e9' },
  { name: 'forest', label: 'Forest', icon: <TreePine size={16} />, color: '#10b981' },
  { name: 'rose', label: 'Rose', icon: <Flower2 size={16} />, color: '#f43f5e' },
  { name: 'sunset', label: 'Sunset', icon: <Sunset size={16} />, color: '#f97316' },

  // Programmer Themes
  { name: 'dracula', label: 'Dracula', icon: <Ghost size={16} />, color: '#bd93f9' },
  { name: 'nord', label: 'Nord', icon: <Snowflake size={16} />, color: '#88c0d0' },
  { name: 'monokai', label: 'Monokai', icon: <Terminal size={16} />, color: '#a6e22e' },
  { name: 'solarized-dark', label: 'Solarized', icon: <Sun size={16} />, color: '#b58900' },
  { name: 'gruvbox', label: 'Gruvbox', icon: <Box size={16} />, color: '#fe8019' },
  { name: 'synthwave', label: 'Synthwave', icon: <Zap size={16} />, color: '#ff00ba' },
];

// Get editor theme based on app theme
function getEditorTheme(theme: ThemeName): string {
  return theme === 'light' ? 'light' : 'vs-dark';
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

function App() {
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('plaintext');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApplyingSettings, setIsApplyingSettings] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [imageSettings, setImageSettings] = useState<ImageSettings>(DEFAULT_SETTINGS);

  // Theme state
  const [theme, setTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('code-ocr-theme');
    return (saved as ThemeName) || 'dark';
  });
  const [showThemePicker, setShowThemePicker] = useState(false);

  // History & Snippets
  const [showHistory, setShowHistory] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [snippets, setSnippets] = useState<SavedSnippet[]>([]);
  const [snippetName, setSnippetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastIdRef = useRef(0);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? '' : theme);
    localStorage.setItem('code-ocr-theme', theme);
  }, [theme]);

  // Initialize Tesseract worker
  useEffect(() => {
    const initWorker = async () => {
      const w = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      setWorker(w);
    };
    initWorker();

    return () => {
      worker?.terminate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load history and snippets from localStorage
  useEffect(() => {
    setHistory(getHistory());
    setSnippets(getSavedSnippets());
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // Apply image settings and update processed image
  const applySettings = useCallback(async (settings: ImageSettings) => {
    if (!image) return;

    setIsApplyingSettings(true);
    try {
      const processed = await applyImageProcessing(image, settings);
      setProcessedImage(processed);
    } catch (error) {
      console.error('Image processing error:', error);
      showToast('Failed to process image', 'error');
    } finally {
      setIsApplyingSettings(false);
    }
  }, [image, showToast]);

  // Apply preset
  const applyPreset = useCallback((presetName: PresetName) => {
    const preset = PRESETS[presetName];
    setImageSettings(preset);
    applySettings(preset);
    showToast(`Applied "${presetName}" preset`, 'success');
  }, [applySettings, showToast]);

  // Reset settings
  const resetSettings = useCallback(() => {
    setImageSettings(DEFAULT_SETTINGS);
    setProcessedImage(null);
  }, []);

  const processImage = useCallback(async (imageData: string, settings?: ImageSettings) => {
    if (!worker) {
      showToast('OCR engine is still loading, please wait...', 'error');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Apply image processing if settings provided
      let imageToProcess = imageData;
      if (settings && JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS)) {
        imageToProcess = await applyImageProcessing(imageData, settings);
        setProcessedImage(imageToProcess);
      }

      const { data: { text } } = await worker.recognize(imageToProcess);

      // Clean up the extracted text
      const cleanedCode = text
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+$/gm, '') // Remove trailing whitespace
        .trim();

      if (!cleanedCode) {
        showToast('No text detected in the image', 'error');
        setIsProcessing(false);
        return;
      }

      setCode(cleanedCode);

      // Auto-detect language
      const detectedLang = detectLanguage(cleanedCode);
      setLanguage(detectedLang);

      // Save to history
      const historyItem = addToHistory(cleanedCode, detectedLang);
      setHistory(prev => [historyItem, ...prev].slice(0, 20));

      showToast(`Code extracted! Detected: ${getLanguageName(detectedLang)}`, 'success');
    } catch (error) {
      console.error('OCR Error:', error);
      showToast('Failed to extract text from image', 'error');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [worker, showToast]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImage(result);
      processImage(result);
    };
    reader.readAsDataURL(file);
  }, [processImage, showToast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  // Global Paste Listener
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Ignore if pasting into an input/textarea (like the code editor or snippet name input)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [handleFile]);

  // Handle Code Formatting
  const handleFormat = async () => {
    if (!code) return;

    // Map application languages to Prettier parsers
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
      xml: 'html', // Attempt to format XML as HTML
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

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          handleFile(file);
        }
        return;
      }
    }
  }, [handleFile]);

  // Listen for paste events
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast('Code copied to clipboard!', 'success');
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  }, [code, showToast]);

  // Copy any text to clipboard
  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!', 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  }, [showToast]);

  const startNew = useCallback(() => {
    setImage(null);
    setProcessedImage(null);
    setCode('');
    setLanguage('plaintext');
    setImageSettings(DEFAULT_SETTINGS);
    setShowSettings(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Load from history
  const loadFromHistory = useCallback((item: HistoryItem) => {
    setCode(item.code);
    setLanguage(item.language);
    setShowHistory(false);
    showToast('Loaded from history', 'success');
  }, [showToast]);

  // Delete from history
  const deleteFromHistory = useCallback((id: string) => {
    removeFromHistory(id);
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  // Clear all history
  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
    showToast('History cleared', 'success');
  }, [showToast]);

  // Save current code as snippet
  const handleSaveSnippet = useCallback(() => {
    if (!code.trim()) {
      showToast('No code to save', 'error');
      return;
    }
    if (!snippetName.trim()) {
      showToast('Please enter a name', 'error');
      return;
    }
    const snippet = saveSnippet(snippetName.trim(), code, language);
    setSnippets(prev => [snippet, ...prev]);
    setSnippetName('');
    setShowSaveDialog(false);
    showToast('Snippet saved!', 'success');
  }, [code, language, snippetName, showToast]);

  // Load snippet
  const loadSnippet = useCallback((snippet: SavedSnippet) => {
    setCode(snippet.code);
    setLanguage(snippet.language);
    setShowSnippets(false);
    showToast(`Loaded "${snippet.name}"`, 'success');
  }, [showToast]);

  // Delete snippet
  const deleteSnippet = useCallback((id: string) => {
    removeSnippet(id);
    setSnippets(prev => prev.filter(s => s.id !== id));
  }, []);

  const lineCount = code.split('\n').length;
  const charCount = code.length;

  return (
    <div className="app">
      <div className="app-container">
        <header className="header">
          <h1 className="header__title">PicCodey</h1>
          <p className="header__subtitle">
            A silly little tool to extract your silly little code from your silly little images with syntax highlighting
          </p>
          <div className="header__actions">
            <button
              className={`btn btn--secondary ${showHistory ? 'btn--active' : ''}`}
              onClick={() => { setShowHistory(!showHistory); setShowSnippets(false); }}
            >
              <History size={iconSize} />
              History {history.length > 0 && <span className="badge">{history.length}</span>}
            </button>
            <button
              className={`btn btn--secondary ${showSnippets ? 'btn--active' : ''}`}
              onClick={() => { setShowSnippets(!showSnippets); setShowHistory(false); }}
            >
              <Bookmark size={iconSize} />
              Snippets {snippets.length > 0 && <span className="badge">{snippets.length}</span>}
            </button>
            <button
              className={`btn btn--secondary ${showThemePicker ? 'btn--active' : ''}`}
              onClick={() => setShowThemePicker(!showThemePicker)}
              title="Change theme"
            >
              <Palette size={iconSize} />
              Theme
            </button>
          </div>
          <div className="header__hint">
            <span className="header__hint-icon"><ClipboardPaste size={iconSize} /></span>
            <span>Press <kbd>Ctrl</kbd> + <kbd>V</kbd> to paste from clipboard</span>
          </div>
        </header>

        <main className="main-content">
          {/* Image Panel */}
          <div className="panel">
            <div className="panel__header">
              <h2 className="panel__title">
                <ImageIcon size={iconSize} />
                Image Source
              </h2>
              {image && (
                <button className="btn btn--secondary" onClick={startNew} title="Start with new image">
                  <Plus size={iconSize} />
                  New Image
                </button>
              )}
            </div>
            <div className="panel__content">
              {!image && !isProcessing && (
                <div
                  className={`dropzone ${isDragging ? 'dropzone--active' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <Upload size={iconSize} />
                  <div className="dropzone__text">
                    <p className="dropzone__title">
                      {isDragging ? 'Drop image here' : 'Drop an image or click to upload'}
                    </p>
                    <p className="dropzone__subtitle">
                      Supports PNG, JPG, GIF, WebP
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </div>
              )}

              {isProcessing && (
                <div className="processing">
                  <div className="processing__spinner" />
                  <p className="processing__text">Extracting code from image...</p>
                  <div className="processing__progress">
                    <div
                      className="processing__bar"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="processing__text">{progress}%</p>
                </div>
              )}

              {image && !isProcessing && (
                <div className="image-preview">
                  <div className="image-preview__container">
                    <img
                      src={processedImage || image}
                      alt="Uploaded code"
                      className="image-preview__img"
                    />
                    {isApplyingSettings && (
                      <div className="image-preview__overlay">
                        <div className="processing__spinner" />
                      </div>
                    )}
                  </div>

                  <div className="image-preview__actions">
                    <button
                      className="btn btn--secondary"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <SlidersHorizontal size={iconSize} />
                      {showSettings ? 'Hide' : 'Tweak'}
                    </button>
                    <button
                      className="btn btn--primary"
                      onClick={() => processImage(image, imageSettings)}
                      disabled={isApplyingSettings}
                    >
                      <Zap size={iconSize} />
                      Extract
                    </button>
                    <button
                      className="btn btn--ghost"
                      onClick={startNew}
                      title="Clear"
                    >
                      <Trash2 size={iconSize} />
                    </button>
                  </div>

                  {showSettings && (
                    <div className="image-settings">
                      <div className="image-settings__header">
                        <span className="image-settings__title">
                          <Wand2 size={iconSize} />
                          Image Enhancement
                        </span>
                        <button
                          className="btn btn--ghost"
                          onClick={resetSettings}
                          title="Reset"
                        >
                          <RotateCcw size={iconSize} />
                        </button>
                      </div>

                      <div className="image-settings__presets">
                        <button className="preset-btn" onClick={() => applyPreset('default')}>Default</button>
                        <button className="preset-btn" onClick={() => applyPreset('darkBackground')}>Dark BG</button>
                        <button className="preset-btn" onClick={() => applyPreset('lowContrast')}>Lo-Contrast</button>
                        <button className="preset-btn" onClick={() => applyPreset('blurry')}>Blurry</button>
                        <button className="preset-btn" onClick={() => applyPreset('textOnly')}>Text Only</button>
                      </div>

                      <div className="image-settings__controls">
                        <div className="setting-row">
                          <label><Sun size={iconSize} /> Brightness</label>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={imageSettings.brightness}
                            onChange={(e) => {
                              const newSettings = { ...imageSettings, brightness: Number(e.target.value) };
                              setImageSettings(newSettings);
                            }}
                          />
                          <span className="setting-value">{imageSettings.brightness}</span>
                        </div>

                        <div className="setting-row">
                          <label><Contrast size={iconSize} /> Contrast</label>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={imageSettings.contrast}
                            onChange={(e) => {
                              const newSettings = { ...imageSettings, contrast: Number(e.target.value) };
                              setImageSettings(newSettings);
                            }}
                          />
                          <span className="setting-value">{imageSettings.contrast}</span>
                        </div>

                        <div className="setting-row">
                          <label><Zap size={iconSize} /> Sharpness</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={imageSettings.sharpness}
                            onChange={(e) => {
                              const newSettings = { ...imageSettings, sharpness: Number(e.target.value) };
                              setImageSettings(newSettings);
                            }}
                          />
                          <span className="setting-value">{imageSettings.sharpness}</span>
                        </div>

                        <div className="setting-row">
                          <label><ZoomIn size={iconSize} /> Upscale</label>
                          <input
                            type="range"
                            min="1"
                            max="4"
                            step="0.5"
                            value={imageSettings.scale}
                            onChange={(e) => {
                              const newSettings = { ...imageSettings, scale: Number(e.target.value) };
                              setImageSettings(newSettings);
                            }}
                          />
                          <span className="setting-value">{imageSettings.scale}x</span>
                        </div>

                        <div className="setting-row setting-row--toggles">
                          <label className="toggle-label">
                            <input
                              type="checkbox"
                              checked={imageSettings.grayscale}
                              onChange={(e) => {
                                const newSettings = { ...imageSettings, grayscale: e.target.checked };
                                setImageSettings(newSettings);
                              }}
                            />
                            <span>Grayscale</span>
                          </label>
                          <label className="toggle-label">
                            <input
                              type="checkbox"
                              checked={imageSettings.invert}
                              onChange={(e) => {
                                const newSettings = { ...imageSettings, invert: e.target.checked };
                                setImageSettings(newSettings);
                              }}
                            />
                            <span>Invert</span>
                          </label>
                        </div>

                        <div className="setting-row">
                          <label>Threshold</label>
                          <input
                            type="range"
                            min="0"
                            max="255"
                            value={imageSettings.threshold}
                            onChange={(e) => {
                              const newSettings = { ...imageSettings, threshold: Number(e.target.value) };
                              setImageSettings(newSettings);
                            }}
                          />
                          <span className="setting-value">{imageSettings.threshold || 'Off'}</span>
                        </div>
                      </div>

                      <button
                        className="btn btn--secondary btn--full"
                        onClick={() => applySettings(imageSettings)}
                        disabled={isApplyingSettings}
                      >
                        {isApplyingSettings ? 'Applying...' : 'Preview Changes'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Code Editor Panel */}
          {code && (
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
                      className={`btn btn--secondary ${!['javascript', 'javascriptreact', 'typescript', 'typescriptreact', 'json', 'css', 'scss', 'less', 'html', 'xml', 'markdown'].includes(language) ? 'btn--disabled' : ''}`}
                      onClick={handleFormat}
                      disabled={!['javascript', 'javascriptreact', 'typescript', 'typescriptreact', 'json', 'css', 'scss', 'less', 'html', 'xml', 'markdown'].includes(language)}
                      style={!['javascript', 'javascriptreact', 'typescript', 'typescriptreact', 'json', 'css', 'scss', 'less', 'html', 'xml', 'markdown'].includes(language) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                      <AlignLeft size={iconSize} />
                    </button>
                    <span className="tooltip-text">
                      {['javascript', 'javascriptreact', 'typescript', 'typescriptreact', 'json', 'css', 'scss', 'less', 'html', 'xml', 'markdown'].includes(language)
                        ? "Format Code"
                        : `Formatting not available for ${getLanguageName(language)}`}
                    </span>
                  </div>
                  <button
                    className="btn btn--secondary"
                    onClick={() => setShowSaveDialog(true)}
                    title="Save as snippet"
                  >
                    <BookmarkPlus size={iconSize} />
                  </button>
                  <button
                    className="btn btn--primary"
                    onClick={copyToClipboard}
                  >
                    <Copy size={iconSize} />
                    Copy
                  </button>
                </div>
              </div>
              <div className="panel__content">
                <div className="editor-wrapper">
                  <div className="editor-container">
                    <Editor
                      height="100%"
                      language={language}
                      value={code}
                      onChange={(value) => setCode(value || '')}
                      theme={getEditorTheme(theme)}
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
          )}

          {/* Empty State for Editor */}
          {!code && !isProcessing && (
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
          )}
        </main>

        {/* Footer */}
        <footer className="footer">
          <div className="footer__content">
            <p className="footer__text">
              Made with <span className="footer__heart"><Heart size={iconSize} fill="currentColor" /></span> by{' '}
              <a href="https://github.com/its-cutie-valerie" target="_blank" rel="noopener noreferrer">
                Valérie
              </a>
            </p>
            <div className="footer__buttons">
              <a
                href="https://ko-fi.com/valerie"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--ghost"
                title="Buy me a coffee"
              >
                <Coffee size={20} />
              </a>
              <a
                href="https://github.com/its-cutie-valerie/code-ocr"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--ghost"
                title="Star on GitHub"
              >
                <Github size={20} />
              </a>
              <a
                href="https://paypal.me/valerie"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--ghost"
                title="Donate"
              >
                <Heart size={20} fill="currentColor" />
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <span className="toast__icon">
            {toast.type === 'success' ? <Check size={iconSize} /> : <AlertCircle size={iconSize} />}
          </span>
          <span className="toast__message">{toast.message}</span>
        </div>
      ))}

      {/* History Panel */}
      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title={
          <>
            <History size={iconSize} />
            Recent Extractions
            {history.length > 0 && <span className="badge">{history.length}</span>}
          </>
        }
        footer={history.length > 0 && (
          <button className="btn btn--secondary" onClick={handleClearHistory}>
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
              <div key={item.id} className="item-card" onClick={() => loadFromHistory(item)}>
                <div className="item-card__actions">
                  <button
                    className="item-card__action"
                    onClick={(e) => { e.stopPropagation(); copyText(item.code); }}
                    title="Copy code"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="item-card__action item-card__action--danger"
                    onClick={(e) => { e.stopPropagation(); deleteFromHistory(item.id); }}
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
                      {formatTimeAgo(item.timestamp)}
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

      {/* Snippets Panel */}
      <Modal
        isOpen={showSnippets}
        onClose={() => setShowSnippets(false)}
        title={
          <>
            <Bookmark size={iconSize} />
            Saved Snippets
            {snippets.length > 0 && <span className="badge">{snippets.length}</span>}
          </>
        }
        footer={code && (
          <button
            className="btn btn--primary"
            onClick={() => { setShowSnippets(false); setShowSaveDialog(true); }}
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
              <div key={snippet.id} className="item-card" onClick={() => loadSnippet(snippet)}>
                <div className="item-card__actions">
                  <button
                    className="item-card__action"
                    onClick={(e) => { e.stopPropagation(); copyText(snippet.code); }}
                    title="Copy code"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="item-card__action item-card__action--danger"
                    onClick={(e) => { e.stopPropagation(); deleteSnippet(snippet.id); }}
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

      {/* Save Snippet Dialog */}
      <Modal
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        title={
          <>
            <BookmarkPlus size={iconSize} />
            Save Snippet
          </>
        }
        size="small"
        footer={
          <>
            <button className="btn btn--secondary" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </button>
            <button className="btn btn--primary" onClick={handleSaveSnippet}>
              <Bookmark size={iconSize} />
              Save Snippet
            </button>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="snippet-name">Snippet Name</label>
          <input
            id="snippet-name"
            type="text"
            className="input"
            placeholder="e.g., React Hook Example"
            value={snippetName}
            onChange={(e) => setSnippetName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveSnippet()}
            autoFocus
          />
        </div>
        <div className="save-preview">
          <span className="lang-badge">{getLanguageName(language)}</span>
          <span>{lineCount} lines, {charCount} chars</span>
        </div>
      </Modal>

      {/* Theme Picker Modal */}
      <Modal
        isOpen={showThemePicker}
        onClose={() => setShowThemePicker(false)}
        title={
          <>
            <Palette size={iconSize} />
            Select Theme
          </>
        }
        size="small"
      >
        <div className="themes-grid">
          {THEMES.map((t) => (
            <button
              key={t.name}
              className={`theme-card ${theme === t.name ? 'theme-card--active' : ''}`}
              onClick={() => setTheme(t.name)}
              style={{ '--theme-color': t.color } as React.CSSProperties}
            >
              <div className="theme-card__icon">{t.icon}</div>
              <span className="theme-card__label">{t.label}</span>
              {theme === t.name && <div className="theme-card__check"><Check size={12} /></div>}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export default App;
