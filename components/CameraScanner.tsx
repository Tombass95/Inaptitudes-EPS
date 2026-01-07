
import React, { useRef, useState, useEffect } from 'react';

interface CameraScannerProps {
  onCapture: (base64: string, cropArea?: { top: number; left: number; width: number; height: number }) => void;
  onClose: () => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStable, setIsStable] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const lastFrameData = useRef<Uint8ClampedArray | null>(null);
  const stabilityCounter = useRef(0);

  useEffect(() => {
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, 
          audio: false 
        });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        console.error("Camera access error:", err);
        onClose();
      }
    }
    startCamera();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Détection de stabilité simplifiée (juste pour aider, pas pour bloquer)
  useEffect(() => {
    let animationFrame: number;
    const checkStability = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          const checkSize = 60;
          canvas.width = checkSize;
          canvas.height = checkSize;
          ctx.drawImage(video, (video.videoWidth/2) - (checkSize/2), (video.videoHeight/2) - (checkSize/2), checkSize, checkSize, 0, 0, checkSize, checkSize);
          const currentFrame = ctx.getImageData(0, 0, checkSize, checkSize).data;
          
          if (lastFrameData.current) {
            let diff = 0;
            for (let i = 0; i < currentFrame.length; i += 16) {
              diff += Math.abs(currentFrame[i] - lastFrameData.current[i]);
            }
            if (diff < 350000) {
              stabilityCounter.current++;
              if (stabilityCounter.current > 15) setIsStable(true);
            } else {
              stabilityCounter.current = 0;
              setIsStable(false);
            }
          }
          lastFrameData.current = currentFrame;
        }
      }
      animationFrame = requestAnimationFrame(checkStability);
    };
    animationFrame = requestAnimationFrame(checkStability);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const capture = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0);
      
      // On envoie l'image entière, le composant parent fera le recadrage fixe
      const base64 = canvas.toDataURL('image/jpeg', 0.85);
      onCapture(base64.split(',')[1]);
      stream?.getTracks().forEach(t => t.stop());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
      <div className="relative flex-1 flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
        
        {/* Guide A4 Statique (Ratio 1:1.41) */}
        <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
          <div className={`w-full max-w-[400px] aspect-[1/1.41] border-2 rounded-xl transition-all duration-300 relative ${isStable ? 'border-green-400 shadow-[0_0_40px_rgba(74,222,128,0.3)]' : 'border-white/40 shadow-[0_0_20px_rgba(0,0,0,0.5)]'}`}>
            <div className="absolute -top-1 -left-1 w-10 h-10 border-t-8 border-l-8 rounded-tl-xl border-current"></div>
            <div className="absolute -top-1 -right-1 w-10 h-10 border-t-8 border-r-8 rounded-tr-xl border-current"></div>
            <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-8 border-l-8 rounded-bl-xl border-current"></div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-8 border-r-8 rounded-br-xl border-current"></div>
            
            <div className="absolute inset-0 flex items-center justify-center">
               <span className={`text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded bg-black/40 backdrop-blur-md transition-colors ${isStable ? 'text-green-400' : 'text-white'}`}>
                {isStable ? 'Prêt' : 'Alignez le document'}
               </span>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="absolute top-10 left-6 w-12 h-12 bg-black/60 text-white rounded-full flex items-center justify-center border border-white/10 active:scale-90">
          <i className="fas fa-times"></i>
        </button>

        <div className="absolute bottom-12 inset-x-0 flex flex-col items-center space-y-4">
           {isCapturing ? (
             <div className="bg-white px-6 py-3 rounded-2xl flex items-center space-x-3 shadow-2xl">
                <i className="fas fa-circle-notch fa-spin text-blue-600"></i>
                <span className="font-black text-xs uppercase text-gray-900">Numérisation...</span>
             </div>
           ) : (
             <button 
                onClick={capture}
                className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 ${isStable ? 'bg-white border-green-500' : 'bg-white/20 border-white/40'}`}
             >
                <div className={`w-14 h-14 rounded-full transition-colors ${isStable ? 'bg-blue-600' : 'bg-white/40'}`}></div>
             </button>
           )}
           <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Appuyez pour capturer</p>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraScanner;
