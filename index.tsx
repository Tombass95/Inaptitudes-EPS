
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/**
 * BRIDGE D'ENVIRONNEMENT ULTRA-ROBUSTE
 * Indispensable pour Netlify + Vite/ESM
 */
const bridgeEnvironment = () => {
  // Initialisation de l'objet process.env si inexistant
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = { env: {} };
  }
  
  const processEnv = (window as any).process.env;

  // 1. Recherche dans import.meta.env (Standard Vite/Netlify)
  try {
    // @ts-ignore
    const viteEnv = (import.meta as any).env || {};
    if (viteEnv.VITE_GEMINI_API_KEY) processEnv.API_KEY = viteEnv.VITE_GEMINI_API_KEY;
    else if (viteEnv.API_KEY) processEnv.API_KEY = viteEnv.API_KEY;
  } catch (e) {
    console.warn("import.meta.env non accessible");
  }

  // 2. Recherche dans les variables globales (Fallback)
  // @ts-ignore
  processEnv.API_KEY = processEnv.API_KEY || (window as any).VITE_GEMINI_API_KEY || (window as any).API_KEY;

  if (processEnv.API_KEY) {
    console.log("✅ Pont API Gemini : Clé détectée et configurée.");
  } else {
    console.error("❌ Pont API Gemini : Aucune clé trouvée dans l'environnement.");
  }
};

bridgeEnvironment();

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
