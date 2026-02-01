
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log("App initialising...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Root element not found");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("App rendered successfully");
} catch (error) {
  console.error("Render error:", error);
}
