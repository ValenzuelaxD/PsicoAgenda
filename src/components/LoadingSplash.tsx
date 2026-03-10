import logo from '../assets/8073927aac7f277f9a509202fa2f1e9e38c58702.png';

interface LoadingSplashProps {
  message?: string;
}

export function LoadingSplash({ message = 'Cargando...' }: LoadingSplashProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-gradient-to-br from-teal-500 via-teal-600 to-violet-600 flex flex-col items-center justify-center"
      style={{ opacity: 1 }}
    >
      {/* Logo con animación */}
      <div className="mb-8" style={{ transform: 'scale(1)', opacity: 1 }}>
        <img
          src={logo}
          alt="PsicoAgenda"
          className="h-32 w-auto"
          style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
        />
      </div>

      {/* Texto de carga */}
      <div
        className="text-center"
        style={{ transform: 'translateY(0)', opacity: 1 }}
      >
        <p className="text-white mb-4">{message}</p>
        
        {/* Spinner */}
        <div className="flex gap-2 justify-center">
          <div
            className="w-3 h-3 bg-white rounded-full"
            style={{ animation: 'bounce 1s infinite' }}
          />
          <div
            className="w-3 h-3 bg-white rounded-full"
            style={{ animation: 'bounce 1s infinite 0.2s' }}
          />
          <div
            className="w-3 h-3 bg-white rounded-full"
            style={{ animation: 'bounce 1s infinite 0.4s' }}
          />
        </div>
      </div>

      {/* Barra de progreso */}
      <div
        className="mt-8 h-1 bg-white/30 rounded-full overflow-hidden"
        style={{ width: '60%', maxWidth: '240px' }}
      >
        <div
          className="h-full bg-white rounded-full"
          style={{ animation: 'slide 1.5s infinite' }}
        />
      </div>
    </div>
  );
}
