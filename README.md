# Marginalia

*Capture code. Anywhere.*

Marginalia is a modern, developer-focused Optical Character Recognition (OCR) web application. It transforms screenshots, photos, and clipboard content into editable, runnable code. Built with a "manual-first" philosophy, it gives you precise control over extraction, editing, execution, and exporting.

## Key Features

### Smart Extraction
-   **Image OCR**: Drag & drop or paste images to extract text using Tesseract.js.
-   **Global Paste**: Paste text or images anywhere in the app (Ctrl+V) to instantly load them.
-   **Auto-Detection**: Automatically detects programming languages from extracted content.

### Powerful Editor
-   **Monaco Editor**: Professional-grade editing experience (VS Code compatible).
-   **Manual Formatting**: One-click formatting for JS, TS, HTML, CSS, JSON, and more via Prettier.
-   **Safe Execution**: Run JavaScript and TypeScript code safely in a sandboxed environment directly within the browser.

### Beautiful & Functional
-   **Smart Export**: Create stunning, Carbon-style images of your code for sharing on social media.
-   **Theme Engine**: Choose from a wide variety of themes (Dracula, Nord, Catppuccin, etc.) via the Settings menu.
-   **History Tracking**: Automatically saves your recent extractions for easy retrieval.

## Technologies

-   **Frontend**: React, TypeScript, Vite
-   **Core**: Tesseract.js (OCR), Monaco Editor (Editing), Prettier (Formatting)
-   **Styling**: Modern CSS variables, Lucide Icons

## Getting Started

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the dev server:
    ```bash
    npm run dev
    ```
4.  Open http://localhost:5173

## How to Use

1.  **Input**: Paste an image/text or drop a file.
2.  **Edit**: Refine the code in the editor.
3.  **Run**: Click the "Play" icon to execute JS/TS code.
4.  **Export**: Click the "Share" icon to generate a beautiful image of your snippet.
5.  **Settings**: Click the "Gear" icon to toggle history or change themes.

## Roadmap

Future improvements and ideas:

- [ ] **Multi-language OCR**: Support for languages beyond English
- [ ] **Batch Processing**: Extract code from multiple images at once
- [ ] **Custom Export Themes**: User-defined gradient backgrounds for exports
- [ ] **Export Formats**: Add SVG and PDF export options
- [ ] **GitHub Gist Integration**: Save snippets directly to GitHub
- [ ] **Browser Extension**: Quick capture from any webpage
- [ ] **Keyboard Shortcuts**: Power-user shortcuts for all actions
- [ ] **PWA Offline Mode**: Full functionality without internet
- [ ] **AI Code Cleanup**: Smart correction of OCR errors using AI
- [ ] **Line Numbers in Export**: Optional line numbers in exported images
- [ ] **Share Links**: Generate shareable URLs for snippets

## Browser Support
Requires a modern browser with WebAssembly support (Chrome, Edge, Firefox, Safari).
