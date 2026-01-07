
import React, { useState, useMemo } from 'react';
import { Exemption, SortOrder } from '../types';
import ExemptionCard from './ExemptionCard';
import { isExpired } from '../utils/dateHelpers';

interface DashboardProps {
  exemptions: Exemption[];
  onExemptionClick: (exemption: Exemption) => void;
  onDelete: (id: string) => void;
}

type FilterType = 'ALL' | 'CERTIF' | 'NOTE';
type StatusFilter = 'ALL' | 'ACTIVE' | 'EXPIRED';

const Dashboard: React.FC<DashboardProps> = ({ exemptions, onExemptionClick, onDelete }) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOrder>(SortOrder.CHRONO_DESC);
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

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
        case SortOrder.ALPHA_ASC:
          return a.lastName.localeCompare(b.lastName);
        case SortOrder.ALPHA_DESC:
          return b.lastName.localeCompare(a.lastName);
        case SortOrder.CHRONO_ASC:
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case SortOrder.CHRONO_DESC:
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        default:
          return 0;
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
    if (statusFilter === target) {
      setStatusFilter('ALL');
    } else {
      setStatusFilter(target);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-24">
      {/* Stats Summary - Now clickable as filters */}
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-end px-1">
          <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Statistiques & Filtres rapides</p>
          {statusFilter !== 'ALL' && (
            <button 
              onClick={() => setStatusFilter('ALL')}
              className="text-[10px] font-bold text-blue-600 uppercase hover:underline"
            >
              Afficher tout
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => handleStatusToggle('ACTIVE')}
            className={`p-4 rounded-2xl shadow-sm border transition-all flex items-center space-x-3 text-left active:scale-95 ${statusFilter === 'ACTIVE' ? 'bg-blue-600 border-blue-600 ring-4 ring-blue-100' : 'bg-white border-gray-100 hover:border-blue-200'}`}
          >
            <div className={`p-3 rounded-full ${statusFilter === 'ACTIVE' ? 'bg-white/20' : 'bg-blue-100'}`}>
              <i className={`fas fa-check ${statusFilter === 'ACTIVE' ? 'text-white' : 'text-blue-600'}`}></i>
            </div>
            <div>
              <p className={`text-2xl font-black ${statusFilter === 'ACTIVE' ? 'text-white' : 'text-gray-800'}`}>{stats.activeCount}</p>
              <p className={`text-[10px] font-bold uppercase tracking-wide ${statusFilter === 'ACTIVE' ? 'text-white/80' : 'text-gray-500'}`}>Actives</p>
            </div>
          </button>
          
          <button 
            onClick={() => handleStatusToggle('EXPIRED')}
            className={`p-4 rounded-2xl shadow-sm border transition-all flex items-center space-x-3 text-left active:scale-95 ${statusFilter === 'EXPIRED' ? 'bg-red-600 border-red-600 ring-4 ring-red-100' : 'bg-white border-gray-100 hover:border-red-200'}`}
          >
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

      {/* Controls */}
      <div className="space-y-4">
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Rechercher élève ou classe..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Categories / Filter Type */}
        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">Type de document</p>
          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
            <button 
              onClick={() => setFilterType('ALL')}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-all border ${filterType === 'ALL' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              Tous
            </button>
            <button 
              onClick={() => setFilterType('CERTIF')}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-all border ${filterType === 'CERTIF' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              Certificats
            </button>
            <button 
              onClick={() => setFilterType('NOTE')}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-all border ${filterType === 'NOTE' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              Demandes parents
            </button>
          </div>
        </div>

        {/* Sorting */}
        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">Trier par</p>
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setSortBy(SortOrder.CHRONO_DESC)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === SortOrder.CHRONO_DESC ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Récents
            </button>
            <button 
              onClick={() => setSortBy(SortOrder.ALPHA_ASC)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === SortOrder.ALPHA_ASC ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Alpha A-Z
            </button>
            <button 
              onClick={() => setSortBy(SortOrder.CHRONO_ASC)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === SortOrder.CHRONO_ASC ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Anciens
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredAndSorted.length > 0 ? (
          filteredAndSorted.map(ex => (
            <ExemptionCard 
              key={ex.id} 
              exemption={ex} 
              onClick={onExemptionClick}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="col-span-full py-12 text-center space-y-2 bg-white rounded-3xl border border-dashed border-gray-200">
            <i className="fas fa-filter text-gray-200 text-5xl"></i>
            <p className="text-gray-400 font-medium italic">Aucun résultat avec ces filtres</p>
            {(statusFilter !== 'ALL' || filterType !== 'ALL' || search !== '') && (
              <button 
                onClick={() => { setStatusFilter('ALL'); setFilterType('ALL'); setSearch(''); }}
                className="text-blue-600 font-bold text-xs uppercase pt-2"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
