
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/**
 * BRIDGE D'ENVIRONNEMENT UNIVERSEL
 * Netlify injecte les variables VITE_ au moment du build.
 * Nous les mappons sur process.env.API_KEY pour respecter les exigences du SDK Gemini.
 */
const ensureProcessEnv = () => {
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = { env: {} };
  }
  
  const processEnv = (window as any).process.env;
  
  // 1. Tenter de récupérer depuis Vite (standard Netlify)
  try {
    // @ts-ignore
    const viteEnv = (import.meta as any).env || {};
    processEnv.API_KEY = processEnv.API_KEY || viteEnv.VITE_GEMINI_API_KEY || viteEnv.API_KEY;
  } catch (e) {}

  // 2. Tenter de récupérer depuis les variables globales
  // @ts-ignore
  processEnv.API_KEY = processEnv.API_KEY || (window as any).VITE_GEMINI_API_KEY || (window as any).API_KEY;

  console.log("Pont API Gemini initialisé.");
};

ensureProcessEnv();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
