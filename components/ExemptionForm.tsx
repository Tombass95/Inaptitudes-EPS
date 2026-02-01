
// Import React to provide the React namespace for types like FC, ChangeEvent, and FormEvent
import React, { useState, useEffect, useRef } from 'react';
import { Exemption } from '../types';
import { extractExemptionData } from '../services/geminiService';
import { calculateEndDate } from '../utils/dateHelpers';
import CameraScanner from './CameraScanner';
import PhotoModal from './PhotoModal';

interface ExemptionFormProps {
  onSave: (exemption: Exemption) => void;
  onCancel: () => void;
  initialData?: Partial<Exemption>;
}

const MISSING_LABEL = "A compléter";

const ExemptionForm: React.FC<ExemptionFormProps> = ({ onSave, onCancel, initialData }) => {
  const cleanValue = (val: any) => {
    if (val === null || val === undefined) return MISSING_LABEL;
    const str = String(val).trim();
    const isBadValue = [
      'null', 'undefined', '', 'non renseignée', 'non renseignee', 'à compléter', 'à completer'
    ].includes(str.toLowerCase());
    
    if (isBadValue) return MISSING_LABEL;
    return str;
  };

  const [formData, setFormData] = useState({
    lastName: cleanValue(initialData?.lastName),
    firstName: cleanValue(initialData?.firstName),
    studentClass: cleanValue(initialData?.studentClass),
    receivedAt: initialData?.receivedAt || new Date().toISOString().split('T')[0],
    startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
    durationDays: initialData?.durationDays || 1,
    isParentalNote: initialData?.isParentalNote || false,
    photoBase64: initialData?.photoBase64 || '',
    isTerminale: initialData?.isTerminale || false,
    mimeType: initialData?.photoBase64?.startsWith('JVBER') ? 'application/pdf' : 'image/jpeg'
  });

  const [scanning, setScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const classRef = useRef<HTMLInputElement>(null);

  const compressImage = (base64: string, type: string = 'image/jpeg'): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX_WIDTH = 1200; // Augmenté pour meilleure lisibilité IA
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
      };
      img.src = base64.startsWith('data:') ? base64 : `data:${type};base64,${base64}`;
    });
  };

  const processAndExtract = async (base64: string, mimeType: string) => {
    setScanning(true);
    setError(null);
    try {
      let finalBase64 = base64;
      let finalMime = mimeType;

      // Correction MIME type pour mobile
      if (!finalMime || finalMime === 'application/octet-stream') {
        finalMime = base64.startsWith('JVBER') ? 'application/pdf' : 'image/jpeg';
      }

      if (finalMime.startsWith('image/')) {
        finalBase64 = await compressImage(base64, finalMime);
        finalMime = 'image/jpeg';
      }

      setFormData(prev => ({ ...prev, photoBase64: finalBase64, mimeType: finalMime }));
      
      const data = await extractExemptionData(finalBase64, finalMime);
      
      const rawLastName = cleanValue(data.lastName);
      setFormData(prev => ({
        ...prev,
        isParentalNote: false,
        lastName: rawLastName === MISSING_LABEL ? rawLastName : rawLastName.toUpperCase(),
        firstName: cleanValue(data.firstName),
        studentClass: cleanValue(data.studentClass),
        durationDays: data.durationDays || 1,
        startDate: data.startDate || prev.startDate,
        isTerminale: data.isTerminale || false
      }));
    } catch (err: any) {
      console.error("Extraction error:", err);
      setError(err.message || "Erreur d'analyse. Veuillez compléter manuellement.");
    } finally {
      setScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size for mobile (Warn if > 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError("Le fichier est trop lourd (max 15Mo). Essayez de prendre une photo plutôt.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      await processAndExtract(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleParentalNote = () => {
    setFormData(prev => ({
      ...prev,
      isParentalNote: true,
      durationDays: 1,
      photoBase64: '',
      startDate: new Date().toISOString().split('T')[0]
    }));
  };

  const handleAutoClearFocus = (fieldName: string) => {
    if ((formData as any)[fieldName] === MISSING_LABEL) {
      setFormData(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.lastName === MISSING_LABEL || formData.firstName === MISSING_LABEL) {
      setError("Veuillez renseigner au moins le nom et le prénom.");
      return;
    }
    const endDate = calculateEndDate(formData.startDate, formData.durationDays);
    onSave({
      ...formData,
      id: initialData?.id || Date.now().toString(),
      endDate
    } as Exemption);
  };

  const isMissing = (val: any) => val === MISSING_LABEL;

  if (showCamera) {
    return <CameraScanner onCapture={(base64) => { setShowCamera(false); processAndExtract(base64, 'image/jpeg'); }} onClose={() => setShowCamera(false)} />;
  }

  return (
    <>
      <div className="bg-white min-h-screen p-4 sm:p-6 rounded-t-3xl shadow-xl max-w-2xl mx-auto mt-4 animate-slide-up pb-24">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 leading-none">
              {initialData?.id ? 'Modifier' : 'Inaptitude'}
            </h2>
            <p className="text-gray-400 text-[10px] font-black uppercase mt-1 tracking-widest">
              {formData.isParentalNote ? 'Demandes parents' : 'Certificat médical'}
            </p>
          </div>
          <button onClick={onCancel} className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center text-gray-400 active:scale-90">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {!initialData?.id && (
          <div className="grid grid-cols-3 gap-2 mb-8">
            <button 
              type="button"
              onClick={() => setShowCamera(true)}
              disabled={scanning}
              className={`flex flex-col items-center justify-center border-2 border-dashed border-blue-200 rounded-2xl p-4 transition-all ${scanning ? 'bg-blue-50 animate-pulse' : 'bg-blue-50/50 hover:bg-blue-100/50 active:scale-95'}`}
            >
              <i className={`fas ${scanning ? 'fa-sync fa-spin' : 'fa-camera'} text-blue-600 text-2xl mb-2`}></i>
              <p className="text-blue-700 font-black text-[9px] uppercase text-center leading-tight">Scanner</p>
            </button>

            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className={`flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 rounded-2xl p-4 transition-all ${scanning ? 'bg-indigo-50 animate-pulse' : 'bg-indigo-50/50 hover:bg-indigo-100/50 active:scale-95'}`}
            >
              <i className="fas fa-file-import text-indigo-600 text-2xl mb-2"></i>
              <p className="text-indigo-700 font-black text-[9px] uppercase text-center leading-tight">Importer</p>
              <input 
                ref={fileInputRef} 
                type="file" 
                className="hidden" 
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
              />
            </button>

            <button 
              type="button"
              onClick={handleParentalNote}
              className="flex flex-col items-center justify-center border-2 border-dashed border-amber-200 rounded-2xl p-4 bg-amber-50/50 hover:bg-amber-100/50 active:scale-95 transition-all"
            >
              <i className="fas fa-file-signature text-amber-600 text-2xl mb-2"></i>
              <p className="text-amber-700 font-black text-[9px] uppercase text-center leading-tight">Parents</p>
            </button>
          </div>
        )}

        {formData.photoBase64 && (
          <div className="mb-6 relative rounded-2xl overflow-hidden border-2 border-gray-100 shadow-md">
            {formData.mimeType === 'application/pdf' ? (
              <div 
                className="w-full h-32 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setShowPreview(true)}
              >
                <i className="fas fa-file-pdf text-red-500 text-4xl mb-2"></i>
                <p className="text-[10px] font-black text-gray-500 uppercase">Fichier PDF importé</p>
                <p className="text-[8px] font-bold text-blue-500 mt-1 uppercase tracking-tighter">Cliquer pour voir l'aperçu</p>
              </div>
            ) : (
              <img 
                src={`data:${formData.mimeType};base64,${formData.photoBase64}`} 
                className="w-full h-48 object-contain bg-gray-50 cursor-pointer" 
                alt="Aperçu"
                onClick={() => setShowPreview(true)}
              />
            )}
            <button 
              type="button"
              onClick={() => setFormData({...formData, photoBase64: '', mimeType: 'image/jpeg'})}
              className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg active:scale-90"
            >
              <i className="fas fa-trash-alt text-sm"></i>
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-xs font-bold rounded-2xl flex items-start border border-red-100">
            <i className="fas fa-exclamation-circle mt-0.5 mr-3 text-red-500"></i> 
            <div>
              <p className="uppercase tracking-tight">Erreur d'analyse</p>
              <p className="font-medium opacity-80 mt-1">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nom</label>
              <input
                ref={lastNameRef}
                type="text"
                required
                onFocus={() => handleAutoClearFocus('lastName')}
                className={`w-full border-2 rounded-xl p-3 outline-none transition-all text-sm font-bold ${isMissing(formData.lastName) ? 'border-amber-400 bg-gray-100 text-gray-400 italic' : 'border-gray-100 bg-gray-50 focus:bg-white focus:border-blue-500 text-gray-900'}`}
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prénom</label>
              <input
                ref={firstNameRef}
                type="text"
                required
                onFocus={() => handleAutoClearFocus('firstName')}
                className={`w-full border-2 rounded-xl p-3 outline-none transition-all text-sm font-bold ${isMissing(formData.firstName) ? 'border-amber-400 bg-gray-100 text-gray-400 italic' : 'border-gray-100 bg-gray-50 focus:bg-white focus:border-blue-500 text-gray-900'}`}
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="space-y-1.5 flex-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Classe</label>
              <input
                ref={classRef}
                type="text"
                required
                onFocus={() => handleAutoClearFocus('studentClass')}
                className={`w-full border-2 rounded-xl p-3 outline-none transition-all text-sm font-bold ${isMissing(formData.studentClass) ? 'border-amber-400 bg-gray-100 text-gray-400 italic' : 'border-gray-100 bg-gray-50 focus:bg-white focus:border-blue-500 text-gray-900'}`}
                value={formData.studentClass}
                onChange={e => setFormData({ ...formData, studentClass: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border-2 border-gray-100">
              <input 
                type="checkbox" 
                id="isTerminale"
                className="w-5 h-5 rounded accent-blue-600"
                checked={formData.isTerminale}
                onChange={e => setFormData({...formData, isTerminale: e.target.checked})}
              />
              <label htmlFor="isTerminale" className="text-xs font-black uppercase text-gray-700 cursor-pointer">Classe de Terminale (BAC)</label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Début</label>
              <input
                type="date"
                required
                className="w-full border-2 border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-bold"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Durée (jours)</label>
              <input
                type="number"
                min="1"
                required
                className="w-full border-2 border-gray-100 rounded-xl p-3 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-bold"
                value={formData.durationDays}
                onChange={e => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="bg-gray-900 p-5 rounded-2xl text-white flex justify-between items-center shadow-xl">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase opacity-50 tracking-widest">Fin de la dispense</span>
              <span className="text-xl font-black">
                {new Date(calculateEndDate(formData.startDate, formData.durationDays)).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <i className="fas fa-calendar-check text-2xl text-blue-500"></i>
          </div>

          <button 
            type="submit" 
            disabled={scanning}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-sm disabled:opacity-50"
          >
            {scanning ? 'Analyse en cours...' : (initialData?.id ? 'Mettre à jour' : 'Enregistrer')}
          </button>
        </form>
      </div>

      {showPreview && formData.photoBase64 && (
        <PhotoModal 
          photoBase64={formData.photoBase64}
          onClose={() => setShowPreview(false)}
          title={formData.lastName !== MISSING_LABEL ? `${formData.lastName} ${formData.firstName}` : "Document Importé"}
        />
      )}
    </>
  );
};

export default ExemptionForm;
