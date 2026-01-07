
import React from 'react';

interface PhotoModalProps {
  photoBase64: string;
  onClose: () => void;
  title: string;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ photoBase64, onClose, title }) => {
  return (
    <div className="fixed inset-0 z-[110] bg-black flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={onClose}
          className="bg-white/20 hover:bg-white/30 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>
      
      <div className="text-white text-center mb-4">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-xs opacity-60">Certificat médical numérisé</p>
      </div>

      <div className="relative w-full max-w-lg aspect-[3/4] bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center">
        <img 
          src={`data:image/jpeg;base64,${photoBase64}`} 
          className="max-w-full max-h-full object-contain"
          alt="Certificat original"
        />
      </div>
      
      <p className="mt-4 text-white/50 text-[10px] uppercase font-bold tracking-widest">Inaptitudes EPS</p>
    </div>
  );
};

export default PhotoModal;
