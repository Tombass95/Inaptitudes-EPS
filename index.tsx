
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/**
 * BRIDGE DE SÉCURITÉ NETLIFY/VITE
 * Sur Netlify/Vite, seules les variables commençant par VITE_ sont visibles par le navigateur.
 * On les mappe sur process.env pour que le SDK Gemini puisse les trouver.
 */
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

// @ts-ignore - On récupère les variables injectées par Vite/Netlify
const viteEnv = (import.meta as any).env || {};
const processEnv = (window as any).process.env;

// On peuple process.env.API_KEY avec la clé que vous avez créée dans Netlify
processEnv.API_KEY = processEnv.API_KEY || viteEnv.VITE_GEMINI_API_KEY || viteEnv.API_KEY;

console.log("App initialising... Environment bridge established.");

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
