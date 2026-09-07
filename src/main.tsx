// Copyright (c) 2025 Jema Technology.
// Distributed under the license specified in the root directory of this project.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>
);

// Register service worker after page load to avoid blocking initial render
if ('serviceWorker' in navigator) {
  globalThis.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed - app still works without it
    });
  });
}
