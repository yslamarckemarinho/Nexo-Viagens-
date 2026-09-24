import React, { useRef } from 'react';

interface NexoLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'color';
  showSubtitle?: boolean;
  citySubtitle?: boolean;
  onSecretAdminTap?: () => void;
  enableSecretTap?: boolean;
}

export const NexoLogo: React.FC<NexoLogoProps> = ({
  size = 'md',
  variant = 'color',
  showSubtitle = true,
  citySubtitle = true,
  onSecretAdminTap,
  enableSecretTap = true,
}) => {
  const tapCountRef = useRef(0);
  const lastTapTimeRef = useRef(0);

  const handleLogoTap = () => {
    if (!enableSecretTap) return;
    const now = Date.now();
    if (now - lastTapTimeRef.current < 900) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }
    lastTapTimeRef.current = now;

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      if (onSecretAdminTap) {
        onSecretAdminTap();
      }
      window.dispatchEvent(new CustomEvent('nexo-secret-admin-trigger'));
    }
  };

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-13 h-13',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const subSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  const isLight = variant === 'light';

  return (
    <div
      onClick={handleLogoTap}
      role="banner"
      title="Nexo Viagens"
      className="flex items-center gap-2.5 select-none cursor-pointer active:scale-95 transition-transform"
    >
      {/* Dynamic Futuristic Nexo Emblem */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]} shrink-0 rounded-2xl p-1.5 shadow-md overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950 border border-cyan-500/30`}>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-transparent to-blue-600/30"></div>
        
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
        >
          {/* Outer hexagonal connections */}
          <path
            d="M24 4L41.32 14V34L24 44L6.68 34V14L24 4Z"
            stroke="url(#nexo-grad-1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2 4"
            className="opacity-40"
          />
          {/* Inner Bold N-Nexus Geometric Shape */}
          <path
            d="M14 34V14L24 26L34 14V34"
            stroke="url(#nexo-grad-2)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Dynamic Speed Nodes / Delivery Dots */}
          <circle cx="14" cy="14" r="2.5" fill="#00F0FF" />
          <circle cx="34" cy="14" r="2.5" fill="#3B82F6" />
          <circle cx="24" cy="26" r="3" fill="#00F0FF" />
          <circle cx="14" cy="34" r="2.5" fill="#3B82F6" />
          <circle cx="34" cy="34" r="2.5" fill="#00F0FF" />

          {/* Gradients */}
          <defs>
            <linearGradient id="nexo-grad-1" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00F0FF" />
              <stop offset="0.5" stopColor="#3B82F6" />
              <stop offset="1" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="nexo-grad-2" x1="14" y1="14" x2="34" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00F0FF" />
              <stop offset="0.5" stopColor="#38BDF8" />
              <stop offset="1" stopColor="#60A5FA" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Title & Tagline */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-tight ${textSizes[size]} ${isLight ? 'text-white' : 'text-slate-900'}`}>
            NEXO
          </span>
          <span className={`font-extrabold tracking-tight ${textSizes[size]} bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent`}>
            VIAGENS
          </span>
        </div>

        {showSubtitle && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`font-bold tracking-wider uppercase ${subSizes[size]} ${isLight ? 'text-cyan-400' : 'text-cyan-700'}`}>
              Mobilidade & Viagens
            </span>
            {citySubtitle && (
              <>
                <span className={`text-[8px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>•</span>
                <span className={`font-bold tracking-normal ${subSizes[size]} ${isLight ? 'text-slate-300' : 'text-slate-600'}`}>
                  Alagoinha - PB
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
