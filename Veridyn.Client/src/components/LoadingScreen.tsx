import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'splitting'>('loading');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setPhase('splitting');
          }, 500);
          setTimeout(() => {
            setIsVisible(false);
            onComplete();
          }, 1800);
          return 100;
        }
        return p + 2;
      });
    }, 25);

    return () => clearInterval(interval);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">

      {/* ── TOP HALF ── */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-auto"
        style={{
          transform: phase === 'splitting' ? 'translateY(-100vh)' : 'translateY(0)',
          transition: 'transform 1.2s cubic-bezier(0.76, 0, 0.24, 1)',
        }}
      >
        {/* White background with centered content */}
        <div className="w-full h-[60vh] bg-[#FAFAFA] relative flex flex-col items-center justify-center">

          {/* Loading Content - Perfectly Centered (accounting for the 20vh svg + 20vh remaining white space at the bottom, so absolute center of the whole screen is actually near the bottom of this 60vh container) */}
          <div
            className={`absolute top-[40vh] left-1/2 -translate-x-1/2 flex flex-col items-center transition-opacity duration-300 ${
              phase === 'splitting' ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {/* Title */}
            <h1 className="text-3xl font-black tracking-[0.25em] text-[#111] uppercase mb-2">
              Alliure
            </h1>

            {/* Tagline */}
            <p className="text-[10px] font-medium tracking-[0.3em] text-[#777] uppercase mb-12">
              Beyond Status.
            </p>

            {/* Pill Progress Bar */}
            <div className="h-7 w-56 bg-[#EEEEEE] rounded-full flex items-center px-2.5 gap-1 overflow-hidden">
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={i}
                  className="h-3 w-1.5 rounded-sm transition-all duration-150"
                  style={{
                    backgroundColor:
                      progress > (i / 15) * 100 ? '#111' : 'transparent',
                  }}
                />
              ))}
            </div>

            {/* Percentage */}
            <div className="mt-4 flex flex-col items-center">
              <span className="text-[10px] font-bold text-[#111] tracking-wider uppercase">
                {progress < 100 ? 'Linking...' : 'Ready.'}
              </span>
            </div>
          </div>
        </div>

        {/* Top SVG Jagged Edge (Pure solid color) */}
        <svg
          className="w-full h-[20vh] block"
          preserveAspectRatio="none"
          viewBox="0 0 1000 200"
        >
          <polygon
            points="0,0 1000,0 1000,80 800,80 750,160 250,160 200,80 0,80"
            fill="#FAFAFA"
          />
        </svg>
      </div>

      {/* ── BOTTOM HALF ── */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-auto"
        style={{
          transform: phase === 'splitting' ? 'translateY(100vh)' : 'translateY(0)',
          transition: 'transform 1.2s cubic-bezier(0.76, 0, 0.24, 1)',
        }}
      >
        {/* Transparent top area that overlaps with top half */}
        <div className="w-full h-[60vh] bg-transparent" />

        {/* Bottom SVG Jagged Edge */}
        <svg
          className="w-full h-[20vh] block"
          preserveAspectRatio="none"
          viewBox="0 0 1000 200"
        >
          <polygon
            points="0,80 200,80 250,160 750,160 800,80 1000,80 1000,200 0,200"
            fill="#FAFAFA"
          />
        </svg>

        <div className="w-full h-[20vh] bg-[#FAFAFA]" />
      </div>
    </div>
  );
};
