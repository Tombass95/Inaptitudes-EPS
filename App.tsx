
import React, { useState, useEffect, useCallback } from 'react';
import { Exemption } from './types';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ExemptionForm from './components/ExemptionForm';
import { isExpired } from './utils/dateHelpers';
import { getExemptionsFromDB, saveExemptionsToDB, clearAllDB } from './services/storageService';

const App: React.FC = () => {
  const [exemptions, setExemptions] = useState<Exemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [view, setView] = useState<'dashboard' | 'form'>('dashboard');
  const [editingExemption, setEditingExemption] = useState<Exemption | undefined>(undefined);

  // Vérification de la clé API (flux standard Google)
  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      const keyFromEnv = process.env.API_KEY;
      // @ts-ignore
      const keyFromStudio = window.aistudio && await window.aistudio.hasSelectedApiKey();
      
      if (!keyFromEnv && !keyFromStudio) {
        setHasKey(false);
      } else {
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    // @ts-ignore
    if (window.aistudio && window.aistudio.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // On assume que c'est ok après l'ouverture du dialogue (règle de race condition)
      setHasKey(true);
    } else {
      alert("La configuration de l'IA n'est pas disponible dans ce navigateur. Assurez-vous d'utiliser une version récente.");
    }
  };

  // Initialisation : Migration localStorage -> IndexedDB puis chargement
  useEffect(() => {
    const initApp = async () => {
      try {
        const savedLocal = localStorage.getItem('eps-inaptitudes');
        let initialData: Exemption[] = [];

        if (savedLocal) {
          initialData = JSON.parse(savedLocal);
          await saveExemptionsToDB(initialData);
          localStorage.removeItem('eps-inaptitudes');
        } else {
          initialData = await getExemptionsFromDB();
        }

        setExemptions(initialData);
      } catch (e) {
        console.error("Erreur d'initialisation du stockage:", e);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveExemptionsToDB(exemptions).catch(err => {
        console.error("Erreur lors de la sauvegarde auto:", err);
      });
    }
  }, [exemptions, isLoading]);

  const handleSave = (newEx: Exemption) => {
    setExemptions(prev => {
      const index = prev.findIndex(ex => ex.id === newEx.id);
      if (index > -1) {
        const updated = [...prev];
        updated[index] = newEx;
        return updated;
      }
      return [newEx, ...prev];
    });
    setView('dashboard');
    setEditingExemption(undefined);
  };

  const handleDelete = (id: string) => {
    setExemptions(prev => prev.filter(ex => ex.id !== id));
  };

  const handleResetAll = useCallback(async () => {
    await clearAllDB();
    setExemptions([]);
    window.scrollTo(0, 0);
  }, []);

  const handleClearExpired = useCallback(() => {
    const allExpired = exemptions.filter(ex => isExpired(ex.endDate));
    if (allExpired.length === 0) return;

    const expiredOthersCount = allExpired.filter(ex => !ex.isTerminale).length;
    if (expiredOthersCount > 0) {
      setExemptions(prev => prev.filter(ex => !(isExpired(ex.endDate) && !ex.isTerminale)));
    } else if (allExpired.length > 0) {
      if (window.confirm(`Supprimer les ${allExpired.length} dossiers de Terminale expirés ?`)) {
        setExemptions(prev => prev.filter(ex => !isExpired(ex.endDate)));
      }
    }
  }, [exemptions]);

  const handleEdit = (exemption: Exemption) => {
    setEditingExemption(exemption);
    setView('form');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <i className="fas fa-sync fa-spin text-blue-600 text-3xl"></i>
          <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Chargement de la base...</p>
        </div>
      </div>
    );
  }

  // Écran d'activation de la clé API si absente (pour Netlify)
  if (!hasKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full border border-blue-50">
          <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl rotate-3">
            <i className="fas fa-robot"></i>
          </div>
          <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2">Activer l'IA</h2>
          <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">
            Pour analyser vos documents automatiquement, une connexion sécurisée à l'IA Google est nécessaire.
          </p>
          <button 
            onClick={handleOpenKeySelector}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all uppercase tracking-widest text-xs mb-4"
          >
            Activer maintenant
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter hover:text-blue-500 underline decoration-gray-200 underline-offset-4"
          >
            En savoir plus sur la facturation
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto sm:max-w-full">
      <Navbar 
        onHomeClick={() => { setView('dashboard'); setEditingExemption(undefined); }}
        onAddClick={() => { setEditingExemption(undefined); setView('form'); }}
        onClearExpired={handleClearExpired}
      />
      
      <main className="flex-1 overflow-y-auto">
        {view === 'dashboard' ? (
          <Dashboard 
            exemptions={exemptions} 
            onExemptionClick={handleEdit}
            onDelete={handleDelete}
            onResetAll={handleResetAll}
          />
        ) : (
          <ExemptionForm 
            onSave={handleSave} 
            onCancel={() => setView('dashboard')}
            initialData={editingExemption}
          />
        )}
      </main>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default App;
