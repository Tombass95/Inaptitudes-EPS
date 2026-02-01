
import React, { useState, useEffect } from 'react';

interface NavbarProps {
  onAddClick: () => void;
  onHomeClick: () => void;
  onClearExpired: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onAddClick, onHomeClick, onClearExpired }) => {
  const [confirmClear, setConfirmClear] = useState(false);

  // Réinitialise l'état de confirmation après 3 secondes d'inactivité
  useEffect(() => {
    if (confirmClear) {
      const timer = setTimeout(() => setConfirmClear(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmClear]);

  const handleClearClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirmClear) {
      onClearExpired();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50 px-4 py-3 flex justify-between items-center select-none">
      <div 
        className="flex items-center space-x-2 cursor-pointer active:opacity-70 transition-opacity" 
        onClick={onHomeClick}
      >
        <i className="fas fa-running text-2xl"></i>
        <h1 className="text-xl font-bold tracking-tight">Inaptitudes EPS</h1>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center">
          {confirmClear && (
            <span className="absolute -left-20 bg-red-600 text-[8px] font-black uppercase px-2 py-1 rounded-md animate-pulse shadow-lg whitespace-nowrap">
              Confirmer ?
            </span>
          )}
          <button 
            onClick={handleClearClick}
            title="Libérer de l'espace (supprimer les expirés)"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-inner ${
              confirmClear 
                ? 'bg-red-500 ring-4 ring-red-200 rotate-12 scale-110' 
                : 'bg-blue-700/50 hover:bg-blue-800'
            }`}
          >
            <i className={`fas fa-broom text-sm ${confirmClear ? 'text-white' : 'text-blue-100'}`}></i>
          </button>
        </div>
        
        <button 
          onClick={onAddClick}
          className="bg-white text-blue-600 px-4 py-2 rounded-full font-bold flex items-center space-x-2 active:scale-95 transition-transform shadow-md"
        >
          <i className="fas fa-plus"></i>
          <span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
