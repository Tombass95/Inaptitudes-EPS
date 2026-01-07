
import React, { useState, useEffect } from 'react';
import { Exemption } from '../types';
import { formatDate, isExpired, getDaysRemaining } from '../utils/dateHelpers';
import PhotoModal from './PhotoModal';

interface ExemptionCardProps {
  exemption: Exemption;
  onClick: (exemption: Exemption) => void;
  onDelete: (id: string) => void;
}

const ExemptionCard: React.FC<ExemptionCardProps> = ({ exemption, onClick, onDelete }) => {
  const [showPhoto, setShowPhoto] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const expired = isExpired(exemption.endDate);
  const remaining = getDaysRemaining(exemption.endDate);

  // Annule la confirmation après 3 secondes d'inactivité
  useEffect(() => {
    if (confirmDelete) {
      const timer = setTimeout(() => setConfirmDelete(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmDelete]);

  const handleActionDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (confirmDelete) {
      onDelete(exemption.id);
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <>
      <div 
        className={`relative bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer ${expired ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}
        onClick={() => onClick(exemption)}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold text-gray-800 leading-tight">
              {exemption.lastName.toUpperCase()} {exemption.firstName}
            </h3>
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
              {exemption.studentClass}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-1">
              {exemption.photoBase64 && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowPhoto(true); }}
                  className="bg-gray-100 text-gray-600 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 active:scale-90"
                >
                  <i className="fas fa-eye text-sm"></i>
                </button>
              )}
              {exemption.isParentalNote ? (
                <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-black uppercase">
                  Demande
                </span>
              ) : (
                <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-black uppercase">
                  Certif
                </span>
              )}
            </div>
            {expired ? (
              <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold uppercase">
                Terminé
              </span>
            ) : remaining <= 3 ? (
               <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">
                Fin J-{remaining}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs mt-3 bg-gray-50 p-2 rounded-lg">
          <div>
            <p className="text-gray-400 uppercase font-bold text-[9px]">Début</p>
            <p className="text-gray-800 font-bold">{formatDate(exemption.startDate)}</p>
          </div>
          <div>
            <p className="text-gray-400 uppercase font-bold text-[9px]">Fin</p>
            <p className={`font-bold ${expired ? 'text-red-600' : 'text-gray-800'}`}>
              {formatDate(exemption.endDate)}
            </p>
          </div>
        </div>
        
        <div className="mt-4 pt-2 border-t border-gray-100 flex justify-between items-center">
          <button 
            type="button"
            onClick={handleActionDelete}
            className={`flex items-center space-x-2 transition-all py-2 px-3 -ml-3 rounded-lg ${confirmDelete ? 'bg-red-600 text-white scale-105' : 'text-gray-400 hover:text-red-600'}`}
          >
            <i className={`fas ${confirmDelete ? 'fa-exclamation-triangle' : 'fa-trash-alt'} text-sm`}></i>
            <span className="font-bold uppercase text-[9px] tracking-tighter">
              {confirmDelete ? 'Confirmer ?' : 'Supprimer'}
            </span>
          </button>
          <span className="text-[9px] italic text-gray-400">Enregistré le {formatDate(exemption.receivedAt)}</span>
        </div>
      </div>

      {showPhoto && exemption.photoBase64 && (
        <PhotoModal 
          photoBase64={exemption.photoBase64} 
          onClose={() => setShowPhoto(false)}
          title={`${exemption.lastName} ${exemption.firstName}`}
        />
      )}
    </>
  );
};

export default ExemptionCard;
