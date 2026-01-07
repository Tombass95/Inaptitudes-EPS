
import React, { useState, useEffect, useRef } from 'react';
import { Exemption } from '../types';
import { extractExemptionData } from '../services/geminiService';
import { calculateEndDate } from '../utils/dateHelpers';
import CameraScanner from './CameraScanner';

interface ExemptionFormProps {
  onSave: (exemption: Exemption) => void;
  onCancel: () => void;
  initialData?: Partial<Exemption>;
}

const MISSING_LABEL = "A compléter";

const ExemptionForm: React.FC<ExemptionFormProps> = ({ onSave, onCancel, initialData }) => {
  // Fonction de nettoyage pour transformer tout résidu en "A compléter"
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
  });

  const [scanning, setScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastNameRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const classRef = useRef<HTMLInputElement>(null);

  const cropToA4Guide = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const displayWidth = img.width;
        const displayHeight = img.height;
        const targetWidth = displayWidth * 0.8;
        const targetHeight = targetWidth * 1.41;
        const x = (displayWidth - targetWidth) / 2;
        const y = (displayHeight - targetHeight) / 2;
        canvas.width = 1000;
        canvas.height = 1410;
        ctx?.drawImage(img, x, y, targetWidth, targetHeight, 0, 0, 1000, 1410);
        resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
      };
      img.src = `data:image/jpeg;base64,${base64}`;
    });
  };

  const processCapture = async (base64: string) => {
    setShowCamera(false);
    setScanning(true);
    setError(null);
    
    try {
      const croppedBase64 = await cropToA4Guide(base64);
      setFormData(prev => ({ ...prev, photoBase64: croppedBase64 }));

      const data = await extractExemptionData(croppedBase64);
      
      const rawLastName = cleanValue(data.lastName);
      
      setFormData(prev => ({
        ...prev,
        isParentalNote: false,
        // On ne met en majuscule que si ce n'est pas le label spécial
        lastName: rawLastName === MISSING_LABEL ? rawLastName : rawLastName.toUpperCase(),
        firstName: cleanValue(data.firstName),
        studentClass: cleanValue(data.studentClass),
        durationDays: data.durationDays || 1,
        startDate: data.startDate || prev.startDate
      }));

      setTimeout(() => {
        if (cleanValue(data.lastName) === MISSING_LABEL) lastNameRef.current?.focus();
        else if (cleanValue(data.firstName) === MISSING_LABEL) firstNameRef.current?.focus();
        else if (cleanValue(data.studentClass) === MISSING_LABEL) classRef.current?.focus();
      }, 500);

    } catch (err) {
      setError("Analyse partielle. Veuillez compléter les champs manquants.");
    } finally {
      setScanning(false);
    }
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

  const handleAutoClearFocus = (fieldName: keyof typeof formData) => {
    if (formData[fieldName] === MISSING_LABEL) {
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
    return <CameraScanner onCapture={processCapture} onClose={() => setShowCamera(false)} />;
  }

  return (
    <div className="bg-white min-h-screen p-4 sm:p-6 rounded-t-3xl shadow-xl max-w-2xl mx-auto mt-4 animate-slide-up">
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
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button 
            type="button"
            onClick={() => setShowCamera(true)}
            disabled={scanning}
            className={`flex flex-col items-center justify-center border-2 border-dashed border-blue-200 rounded-2xl p-6 transition-all ${scanning ? 'bg-blue-50 animate-pulse' : 'bg-blue-50/50 hover:bg-blue-100/50 active:scale-95'}`}
          >
            <i className={`fas ${scanning ? 'fa-sync fa-spin' : 'fa-camera'} text-blue-600 text-3xl mb-3`}></i>
            <p className="text-blue-700 font-black text-[10px] uppercase text-center leading-tight">Scanner le certificat</p>
          </button>

          <button 
            type="button"
            onClick={handleParentalNote}
            className="flex flex-col items-center justify-center border-2 border-dashed border-amber-200 rounded-2xl p-6 bg-amber-50/50 hover:bg-amber-100/50 active:scale-95 transition-all"
          >
            <i className="fas fa-file-signature text-amber-600 text-3xl mb-3"></i>
            <p className="text-amber-700 font-black text-[10px] uppercase text-center leading-tight">Demandes parents</p>
          </button>
        </div>
      )}

      {formData.photoBase64 && (
        <div className="mb-6 relative rounded-2xl overflow-hidden border-2 border-gray-100 shadow-md">
          <img 
            src={`data:image/jpeg;base64,${formData.photoBase64}`} 
            className="w-full h-48 object-contain bg-gray-50" 
            alt="Aperçu"
          />
          <button 
            type="button"
            onClick={() => setFormData({...formData, photoBase64: ''})}
            className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg active:scale-90"
          >
            <i className="fas fa-trash-alt text-sm"></i>
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center">
          <i className="fas fa-exclamation-circle mr-2"></i> {error}
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

        <div className="space-y-1.5">
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-sm"
        >
          {initialData?.id ? 'Mettre à jour' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
};

export default ExemptionForm;
