
import React, { useState, useMemo, useEffect } from 'react';
import { Exemption, SortOrder } from '../types';
import ExemptionCard from './ExemptionCard';
import { isExpired } from '../utils/dateHelpers';

interface DashboardProps {
  exemptions: Exemption[];
  onExemptionClick: (exemption: Exemption) => void;
  onDelete: (id: string) => void;
  onResetAll: () => void;
}

type FilterType = 'ALL' | 'CERTIF' | 'NOTE';
type StatusFilter = 'ALL' | 'ACTIVE' | 'EXPIRED';

const Dashboard: React.FC<DashboardProps> = ({ exemptions, onExemptionClick, onDelete, onResetAll }) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOrder>(SortOrder.CHRONO_DESC);
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  
  const [resetStep, setResetStep] = useState(0);

  useEffect(() => {
    if (resetStep > 0) {
      const timer = setTimeout(() => setResetStep(0), 5000);
      return () => clearTimeout(timer);
    }
  }, [resetStep]);

  const filteredAndSorted = useMemo(() => {
    let result = exemptions.filter(ex => {
      const expired = isExpired(ex.endDate);
      const matchesSearch = `${ex.firstName} ${ex.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        ex.studentClass.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'ALL' || 
        (filterType === 'NOTE' && ex.isParentalNote) ||
        (filterType === 'CERTIF' && !ex.isParentalNote);
      const matchesStatus = statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && !expired) ||
        (statusFilter === 'EXPIRED' && expired);
      return matchesSearch && matchesType && matchesStatus;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case SortOrder.ALPHA_ASC: return a.lastName.localeCompare(b.lastName);
        case SortOrder.ALPHA_DESC: return b.lastName.localeCompare(a.lastName);
        case SortOrder.CHRONO_ASC: return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case SortOrder.CHRONO_DESC: return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case SortOrder.CLASS_ASC: return a.studentClass.localeCompare(b.studentClass, undefined, { numeric: true }) || a.lastName.localeCompare(b.lastName);
        default: return 0;
      }
    });
    return result;
  }, [exemptions, search, sortBy, filterType, statusFilter]);

  const stats = useMemo(() => {
    const expiredCount = exemptions.filter(ex => isExpired(ex.endDate)).length;
    const activeCount = exemptions.length - expiredCount;
    return { expiredCount, activeCount };
  }, [exemptions]);

  const handleStatusToggle = (target: StatusFilter) => {
    setStatusFilter(prev => prev === target ? 'ALL' : target);
  };

  const handleResetSequence = (e: React.MouseEvent) => {
    e.preventDefault();
    if (resetStep === 0) setResetStep(1);
    else if (resetStep === 1) setResetStep(2);
    else if (resetStep === 2) {
      onResetAll();
      setResetStep(0);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-24">
      {/* Stats Summary */}
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-end px-1">
          <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Statistiques & Filtres rapides</p>
          {statusFilter !== 'ALL' && (
            <button onClick={() => setStatusFilter('ALL')} className="text-[10px] font-bold text-blue-600 uppercase">Afficher tout</button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => handleStatusToggle('ACTIVE')} className={`p-4 rounded-2xl shadow-sm border transition-all flex items-center space-x-3 text-left active:scale-95 ${statusFilter === 'ACTIVE' ? 'bg-blue-600 border-blue-600 ring-4 ring-blue-100' : 'bg-white border-gray-100 hover:border-blue-200'}`}>
            <div className={`p-3 rounded-full ${statusFilter === 'ACTIVE' ? 'bg-white/20' : 'bg-blue-100'}`}>
              <i className={`fas fa-check ${statusFilter === 'ACTIVE' ? 'text-white' : 'text-blue-600'}`}></i>
            </div>
            <div>
              <p className={`text-2xl font-black ${statusFilter === 'ACTIVE' ? 'text-white' : 'text-gray-800'}`}>{stats.activeCount}</p>
              <p className={`text-[10px] font-bold uppercase tracking-wide ${statusFilter === 'ACTIVE' ? 'text-white/80' : 'text-gray-500'}`}>Actives</p>
            </div>
          </button>
          <button onClick={() => handleStatusToggle('EXPIRED')} className={`p-4 rounded-2xl shadow-sm border transition-all flex items-center space-x-3 text-left active:scale-95 ${statusFilter === 'EXPIRED' ? 'bg-red-600 border-red-600 ring-4 ring-red-100' : 'bg-white border-gray-100 hover:border-red-200'}`}>
            <div className={`p-3 rounded-full ${statusFilter === 'EXPIRED' ? 'bg-white/20' : 'bg-red-100'}`}>
              <i className={`fas fa-clock ${statusFilter === 'EXPIRED' ? 'text-white' : 'text-red-600'}`}></i>
            </div>
            <div>
              <p className={`text-2xl font-black ${statusFilter === 'EXPIRED' ? 'text-white' : 'text-gray-800'}`}>{stats.expiredCount}</p>
              <p className={`text-[10px] font-bold uppercase tracking-wide ${statusFilter === 'EXPIRED' ? 'text-white/80' : 'text-gray-500'}`}>Expirées</p>
            </div>
          </button>
        </div>
      </div>

      {/* Search & Sorting */}
      <div className="space-y-4">
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" placeholder="Rechercher élève ou classe..." className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={() => setFilterType('ALL')} className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold border ${filterType === 'ALL' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'}`}>Tous</button>
          <button onClick={() => setFilterType('CERTIF')} className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold border ${filterType === 'CERTIF' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>Certificats</button>
          <button onClick={() => setFilterType('NOTE')} className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold border ${filterType === 'NOTE' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200'}`}>Demandes parents</button>
        </div>
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {[{id: SortOrder.CHRONO_DESC, label: 'Récents'}, {id: SortOrder.CLASS_ASC, label: 'Classe'}, {id: SortOrder.ALPHA_ASC, label: 'Alpha A-Z'}, {id: SortOrder.CHRONO_ASC, label: 'Anciens'}].map(sort => (
            <button key={sort.id} onClick={() => setSortBy(sort.id)} className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold ${sortBy === sort.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{sort.label}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredAndSorted.length > 0 ? (
          filteredAndSorted.map(ex => <ExemptionCard key={ex.id} exemption={ex} onClick={onExemptionClick} onDelete={onDelete} />)
        ) : (
          <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-gray-200">
            <i className="fas fa-filter text-gray-200 text-5xl mb-2"></i>
            <p className="text-gray-400 font-medium italic">Aucun résultat</p>
          </div>
        )}
      </div>

      {/* Maintenance Section with Storage Info */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="bg-gray-100/50 rounded-3xl p-6 border border-gray-200 flex flex-col items-center text-center space-y-4">
           <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-1 rounded-full">
              <i className="fas fa-database text-[10px]"></i>
              <span className="text-[9px] font-black uppercase tracking-tight">Stockage Étendu (IndexedDB) Actif</span>
           </div>
           
           <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${resetStep > 0 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              <i className={`fas ${resetStep === 2 ? 'fa-bomb' : 'fa-exclamation-triangle'} text-xl`}></i>
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Fin d'année scolaire</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                {resetStep === 0 && "Pour vider intégralement la base de données et repartir à neuf."}
                {resetStep === 1 && "Êtes-vous sûr ? Cette action est irréversible."}
                {resetStep === 2 && "Dernière étape : confirmation définitive."}
              </p>
            </div>
            
            <button onClick={handleResetSequence} className={`mt-2 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-sm ${resetStep === 0 ? 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50' : resetStep === 1 ? 'bg-orange-500 text-white scale-105' : 'bg-gray-900 text-white animate-pulse scale-110'}`}>
              {resetStep === 0 && "Réinitialiser l'année"}
              {resetStep === 1 && "Vraiment sûr ?"}
              {resetStep === 2 && "CONFIRMER L'EFFACEMENT"}
            </button>
            
            {resetStep > 0 && (
              <button onClick={() => setResetStep(0)} className="text-[10px] font-black text-gray-400 uppercase tracking-tighter hover:underline">Annuler</button>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
