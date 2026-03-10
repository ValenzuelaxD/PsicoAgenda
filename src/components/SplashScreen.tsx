import { useEffect } from 'react';
import logo from '../assets/8073927aac7f277f9a509202fa2f1e9e38c58702.png';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <img
          src={logo}
          alt="PsicoAgenda"
          className="w-48 h-auto mb-8 md:w-64"
          style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
        />
        
        <div className="text-center">
          <h1 className="text-white mb-2 text-2xl font-bold">PsicoAgenda</h1>
          <p className="text-slate-300">
            Sistema de gestión para profesionales de la salud mental
          </p>
        </div>

        <div className="mt-8 flex gap-2">
          <div className="w-3 h-3 bg-teal-500 rounded-full" style={{ animation: 'bounce 0.6s infinite' }} />
          <div className="w-3 h-3 bg-violet-500 rounded-full" style={{ animation: 'bounce 0.6s infinite 0.2s' }} />
          <div className="w-3 h-3 bg-teal-500 rounded-full" style={{ animation: 'bounce 0.6s infinite 0.4s' }} />
        </div>
      </div>
    </div>
  );
}