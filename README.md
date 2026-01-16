# PicCodey

PicCodey is a specialized Optical Character Recognition (OCR) web application designed for extracting source code from images. It combines a powerful OCR engine with a fully featured code editor, allowing developers to digitize, edit, and format code snippets from screenshots or photos.

## Features

-   **Intelligent Code OCR**: Utilizes Tesseract.js to extract text from images with optimizations for programming syntax.
-   **Integrated Code Editor**: Built on Monaco Editor (the core of VS Code) for a familiar editing experience with syntax highlighting.
-   **Code Formatting**: Integrated Prettier support to automatically format extracted code for JavaScript, TypeScript, HTML, CSS, JSON, and Markdown.
-   **Global Paste Support**: Paste images directly from the clipboard anywhere in the application window.
-   **Local Storage History**: Automatically saves extracted snippets and history to the browser's local storage for privacy and persistence.
-   **Syntax Highlighting**: Supports auto-detection and manual selection for a wide variety of programming languages.
-   **Customizable Aesthetics**: Features multiple high-contrast themes optimized for accessibility and coding environments.

## Technologies Used

-   **React**: UI components and state management.
-   **Tesseract.js**: Browser-based OCR engine.
-   **Monaco Editor**: Professional-grade code editing interface.
-   **Prettier**: Code formatting logic.
-   **Vite**: Fast build tool and development server.

## Installation and Setup

To run this project locally, follow these steps:

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open the application in your browser at the provided localhost URL (typically http://localhost:5173).

## Usage Guide

1.  **Extract Code**: Drag and drop an image file into the upload zone, or paste an image from your clipboard.
2.  **Edit**: The extracted text will appear in the editor. Use the toolbar to select the programming language if it was not correctly detected.
3.  **Format**: Click the "Format" button in the toolbar to clean up the code indentation and style. Note: Formatting is available for supported languages only.
4.  **Save/History**: Extracted snippets are automatically saved to your history. You can also manually save snippets for long-term storage.

## Browser Support

This application relies on modern web technologies including WebAssembly for the OCR engine. Ideally, use the latest versions of Chrome, Firefox, Safari, or Edge.
