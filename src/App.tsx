import { useState, useEffect, useCallback, useRef } from 'react';
import { createWorker, type Worker } from 'tesseract.js';
import {
  processImage as applyImageProcessing,
  DEFAULT_SETTINGS,
  type ImageSettings,
} from './imageProcessing';
import {
  getHistory,
  addToHistory,
  removeFromHistory,
  clearHistory,
  getSavedSnippets,
  saveSnippet,
  removeSnippet,
  type HistoryItem,
  type SavedSnippet,
} from './storage';
import {
  ClipboardPaste,
  Heart,
  Github,
  Settings,
  History as HistoryIcon,
  Bookmark,
} from 'lucide-react';
import './App.css';
import { ExportModal } from './components/ExportModal';
import { CodeRunner } from './components/CodeRunner';
import { SettingsModal, type AppPreferences, type ThemeName } from './components/SettingsModal';
import { detectLanguage, getLanguageName } from './utils/languageDetection';
import { useToast } from './context/ToastContext';
import { ImagePreview } from './components/ImagePreview';
import { CodeEditor } from './components/CodeEditor';
import { HistoryModal } from './components/HistoryModal';
import { SnippetsModal } from './components/SnippetsModal';

const iconSize = 16;

function App() {
  const { showToast } = useToast();
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('plaintext');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApplyingSettings, setIsApplyingSettings] = useState(false);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [imageSettings, setImageSettings] = useState<ImageSettings>(DEFAULT_SETTINGS);

  // App Preferences
  const [preferences, setPreferences] = useState<AppPreferences>(() => {
    const saved = localStorage.getItem('marginalia-preferences');
    return saved ? JSON.parse(saved) : {
      saveHistory: true,
    };
  });

  const updatePreference = useCallback((key: keyof AppPreferences, value: boolean) => {
    setPreferences(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('marginalia-preferences', JSON.stringify(next));
      return next;
    });
  }, []);

  // Theme state
  const [theme, setTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('marginalia-theme');
    return (saved as ThemeName) || 'auto';
  });

  // Resolved theme (what's actually applied)
  const [resolvedTheme, setResolvedTheme] = useState<string>(() => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? '' : 'light';
    }
    return theme === 'dark' ? '' : theme;
  });

  // History & Snippets
  const [showHistory, setShowHistory] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [snippets, setSnippets] = useState<SavedSnippet[]>([]);

  // New Features State
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCodeRunner, setShowCodeRunner] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply theme to document and handle auto theme
  useEffect(() => {
    const applyTheme = (selectedTheme: ThemeName) => {
      if (selectedTheme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? '' : 'light';
      }
      return selectedTheme === 'dark' ? '' : selectedTheme;
    };

    const resolved = applyTheme(theme);
    setResolvedTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem('marginalia-theme', theme);

    // Listen for system theme changes when in auto mode
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const newResolved = e.matches ? '' : 'light';
        setResolvedTheme(newResolved);
        document.documentElement.setAttribute('data-theme', newResolved);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Initialize Tesseract worker
  useEffect(() => {
    const initWorker = async () => {
      const w = await createWorker('eng', 1, {
        logger: () => {
          // Progress handled internally differently now, or removed from UI to simplify
        },
      });
      setWorker(w);
    };
    initWorker();

    return () => {
      worker?.terminate();
    };
  }, []);

  // Load history and snippets from localStorage
  useEffect(() => {
    setHistory(getHistory());
    setSnippets(getSavedSnippets());
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


  const processImage = useCallback(async (imageData: string, settings?: ImageSettings) => {
    if (!worker) {
      showToast('OCR engine is still loading, please wait...', 'error');
      return;
    }

    setIsProcessing(true);

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

      // Save to history (Preference check)
      if (preferences.saveHistory) {
        const historyItem = addToHistory(cleanedCode, detectedLang);
        setHistory(prev => [historyItem, ...prev].slice(0, 20));
      }

      showToast(`Code extracted! Detected: ${getLanguageName(detectedLang)}`, 'success');

    } catch (error) {
      console.error('OCR Error:', error);
      showToast('Failed to extract text from image', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [worker, showToast, preferences]);

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

  // Global Paste Listener
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      // Ignore if pasting into an input/textarea (like the code editor or snippet name input)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      // Prioritize images first
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleFile(file);
            return; // Stop checking items
          }
        }
      }

      // If no image found, check for text
      const text = e.clipboardData?.getData('text/plain');
      if (text && text.trim()) {
        e.preventDefault();

        // Update states for text mode
        setImage(null);
        setProcessedImage(null);
        setCode(text);

        // Detect language
        const detected = detectLanguage(text);
        setLanguage(detected);

        // Save to History for paste? Usually yes if it's new. 
        // Logic: if preferences.saveHistory is true.
        if (preferences.saveHistory) {
          const historyItem = addToHistory(text, detected);
          setHistory(prev => [historyItem, ...prev].slice(0, 20));
        }

        showToast(`Code pasted! Detected: ${getLanguageName(detected)}`, 'success');
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [handleFile, showToast, preferences]);

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
  const handleSaveSnippet = useCallback(async (snippetName: string) => {
    const snippet = saveSnippet(snippetName.trim(), code, language);
    setSnippets(prev => [snippet, ...prev]);
    showToast('Snippet saved!', 'success');
  }, [code, language, showToast]);

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

  return (
    <div className="app">
      <div className="app-container">
        <header className="header">
          <h1 className="header__title">Marginalia</h1>
          <p className="header__subtitle">
            Capture code. Anywhere.
          </p>
          <div className="header__actions">
            <button
              className={`btn btn--secondary ${showHistory ? 'btn--active' : ''}`}
              onClick={() => { setShowHistory(!showHistory); setShowSnippets(false); }}
              title="History"
            >
              <HistoryIcon size={iconSize} />
              {history.length > 0 && <span className="badge">{history.length}</span>}
            </button>
            <button
              className={`btn btn--secondary ${showSnippets ? 'btn--active' : ''}`}
              onClick={() => { setShowSnippets(!showSnippets); setShowHistory(false); }}
              title="Snippets"
            >
              <Bookmark size={iconSize} />
              {snippets.length > 0 && <span className="badge">{snippets.length}</span>}
            </button>
            <button
              className={`btn btn--secondary ${showSettingsModal ? 'btn--active' : ''}`}
              onClick={() => setShowSettingsModal(true)}
              title="Settings"
            >
              <Settings size={iconSize} />
            </button>
          </div>
          <div className="header__hint">
            <span className="header__hint-icon"><ClipboardPaste size={iconSize} /></span>
            <span>Press <kbd>Ctrl</kbd> + <kbd>V</kbd> to paste from clipboard</span>
          </div>
        </header>

        <main className="main-content">
          <ImagePreview
            image={image}
            processedImage={processedImage}
            isProcessing={isProcessing}
            isApplyingSettings={isApplyingSettings}
            imageSettings={imageSettings}
            setImageSettings={setImageSettings}
            onProcess={processImage}
            onClear={startNew}
            onApplySettings={applySettings}
            onFileUpload={handleFile}
          />

          <CodeEditor
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            theme={resolvedTheme}
            isProcessing={isProcessing}
            onSaveSnippet={() => setShowSnippets(true)} // Open snippets modal to save
            onCopyToClipboard={copyToClipboard}
            onRunCode={() => setShowCodeRunner(true)}
            onExport={() => setShowExportModal(true)}
          />
        </main>

        <footer className="footer">
          <div className="footer__content">
            <p className="footer__text">
              <a href="https://github.com/its-cutie-valerie" target="_blank" rel="noopener noreferrer">
                Made with <span className="footer__heart"><Heart size={iconSize} fill="currentColor" /></span> by Valérie
              </a>
            </p>
            <div className="footer__buttons">
              {/* TODO: to do later
              <a
                href="https://ko-fi.com/valerie"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--ghost"
                title="Buy me a coffee"
              >
                <Coffee size={20} />
              </a>
              */}
              <a
                href="https://github.com/its-cutie-valerie"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--ghost"
                title="Star on GitHub"
              >
                <Github size={20} />
              </a>
            </div>
          </div>
        </footer>
      </div>

      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        onLoad={loadFromHistory}
        onDelete={deleteFromHistory}
        onClearAll={handleClearHistory}
        onCopy={copyText}
      />

      <SnippetsModal
        isOpen={showSnippets}
        onClose={() => setShowSnippets(false)}
        snippets={snippets}
        onLoad={loadSnippet}
        onDelete={deleteSnippet}
        onSaveCurrent={() => {
          // Simple prompt for now, could be improved with a custom dialog inside SnippetsModal or separate
          const name = prompt('Enter snippet name:');
          if (name) handleSaveSnippet(name);
        }}
        onCopy={copyText}
        hasCodeToSave={!!code}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        code={code}
        language={language}
      />

      {/* Code Runner Modal */}
      <CodeRunner
        isOpen={showCodeRunner}
        onClose={() => setShowCodeRunner(false)}
        code={code}
        language={language}
      />
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        theme={theme}
        setTheme={setTheme}
        preferences={preferences}
        onUpdatePreference={updatePreference}
      />
    </div>
  );
}

export default App;
