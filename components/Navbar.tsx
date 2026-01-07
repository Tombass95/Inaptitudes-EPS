
import React from 'react';

interface NavbarProps {
  onAddClick: () => void;
  onHomeClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onAddClick, onHomeClick }) => {
  return (
    <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50 px-4 py-3 flex justify-between items-center">
      <div 
        className="flex items-center space-x-2 cursor-pointer" 
        onClick={onHomeClick}
      >
        <i className="fas fa-running text-2xl"></i>
        <h1 className="text-xl font-bold tracking-tight">Inaptitudes EPS</h1>
      </div>
      <button 
        onClick={onAddClick}
        className="bg-white text-blue-600 px-4 py-2 rounded-full font-bold flex items-center space-x-2 active:scale-95 transition-transform"
      >
        <i className="fas fa-plus"></i>
        <span className="hidden sm:inline">Ajouter</span>
      </button>
    </nav>
  );
};

export default Navbar;
