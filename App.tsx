
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
  const [view, setView] = useState<'dashboard' | 'form'>('dashboard');
  const [editingExemption, setEditingExemption] = useState<Exemption | undefined>(undefined);

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
