
import React, { useState, useEffect } from 'react';
import { Exemption } from './types';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ExemptionForm from './components/ExemptionForm';

const App: React.FC = () => {
  const [exemptions, setExemptions] = useState<Exemption[]>(() => {
    const saved = localStorage.getItem('eps-inaptitudes');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  const [view, setView] = useState<'dashboard' | 'form'>('dashboard');
  const [editingExemption, setEditingExemption] = useState<Exemption | undefined>(undefined);

  useEffect(() => {
    localStorage.setItem('eps-inaptitudes', JSON.stringify(exemptions));
  }, [exemptions]);

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
    // Suppression directe car la confirmation est maintenant gérée par le bouton dans la carte
    setExemptions(prev => prev.filter(ex => ex.id !== id));
  };

  const handleEdit = (exemption: Exemption) => {
    setEditingExemption(exemption);
    setView('form');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto sm:max-w-full">
      <Navbar 
        onHomeClick={() => { setView('dashboard'); setEditingExemption(undefined); }}
        onAddClick={() => { setEditingExemption(undefined); setView('form'); }} 
      />
      
      <main className="flex-1 overflow-y-auto">
        {view === 'dashboard' ? (
          <Dashboard 
            exemptions={exemptions} 
            onExemptionClick={handleEdit}
            onDelete={handleDelete}
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
