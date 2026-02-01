
import React from 'react';

interface PhotoModalProps {
  photoBase64: string;
  onClose: () => void;
  title: string;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ photoBase64, onClose, title }) => {
  // Détection propre du format (PDF commence par JVBER en base64)
  const pureBase64 = photoBase64.includes(',') ? photoBase64.split(',')[1] : photoBase64;
  const isPdf = pureBase64.startsWith('JVBER'); 

  const dataUrl = isPdf 
    ? `data:application/pdf;base64,${pureBase64}`
    : (photoBase64.startsWith('data:') ? photoBase64 : `data:image/jpeg;base64,${photoBase64}`);

  // Méthode de secours pour mobile : ouvrir dans un nouvel onglet via un Blob URL
  const handleOpenExternal = () => {
    try {
      const binary = atob(pureBase64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([array], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.error("Erreur lors de l'ouverture du PDF", e);
      window.open(dataUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md">
      {/* Barre d'outils supérieure */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-4 px-2">
        <div className="text-white">
          <h3 className="text-lg font-black tracking-tight">{title}</h3>
          <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest flex items-center">
            <i className={`fas ${isPdf ? 'fa-file-pdf text-red-500' : 'fa-image text-blue-500'} mr-2`}></i>
            {isPdf ? 'Document PDF' : 'Certificat Image'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {isPdf && (
            <button 
              onClick={handleOpenExternal}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl flex items-center space-x-2 backdrop-blur-md transition-all active:scale-90"
              title="Ouvrir dans un nouvel onglet"
            >
              <i className="fas fa-external-link-alt text-xs"></i>
              <span className="text-[10px] font-black uppercase">Ouvrir</span>
            </button>
          )}
          <button 
            onClick={onClose}
            className="bg-red-500/20 hover:bg-red-500/40 text-red-500 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
      </div>

      {/* Zone de contenu principale */}
      <div className="relative w-full max-w-5xl h-[75vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex items-center justify-center border border-white/10">
        {isPdf ? (
          <div className="w-full h-full relative group">
            <iframe 
              src={dataUrl} 
              className="w-full h-full border-none"
              title="PDF Preview"
            />
            {/* Note pour mobile si l'iframe ne charge pas */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 md:hidden">
               <p className="bg-white/90 px-4 py-2 rounded-full text-[10px] font-black shadow-lg backdrop-blur-sm">
                 Appuyez sur "OUVRIR" si l'aperçu est vide
               </p>
            </div>
          </div>
        ) : (
          <img 
            src={dataUrl} 
            className="max-w-full max-h-full object-contain p-2"
            alt="Document original"
          />
        )}
      </div>
      
      {/* Pied de page et actions secondaires */}
      <div className="mt-6 flex flex-col items-center">
        <div className="flex items-center space-x-2 text-white/30 mb-2">
          <i className="fas fa-running"></i>
          <span className="text-[10px] uppercase font-black tracking-[0.4em]">Inaptitudes EPS</span>
        </div>
        {isPdf && (
           <a 
            href={dataUrl} 
            download={`${title.replace(/\s+/g, '_')}.pdf`}
            className="text-blue-400 text-[10px] font-black uppercase hover:underline transition-colors hover:text-blue-300"
           >
             <i className="fas fa-download mr-1"></i> Télécharger le document
           </a>
        )}
      </div>
    </div>
  );
};

export default PhotoModal;
