'use client';

export default function FloatingDoodles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {/* Star — top right (all screens) */}
      <svg className="absolute top-16 right-[5%] w-10 h-10 sm:w-14 sm:h-14 animate-float" style={{ opacity: 0.18 }} viewBox="0 0 50 50" fill="none" stroke="#7bc043" strokeWidth="2">
        <path d="M25 5 L28 18 L42 18 L31 27 L35 40 L25 32 L15 40 L19 27 L8 18 L22 18Z" />
      </svg>

      {/* Dashed circle — left (all screens) */}
      <svg className="absolute top-[30%] left-[2%] w-12 h-12 sm:w-20 sm:h-20 animate-float" style={{ opacity: 0.15, animationDelay: '1.2s' }} viewBox="0 0 60 60" fill="none" stroke="#4ecdc4" strokeWidth="2.5" strokeDasharray="6 6">
        <circle cx="30" cy="30" r="24" />
      </svg>

      {/* Yellow square — right (all screens) */}
      <svg className="absolute top-[45%] right-[3%] w-8 h-8 sm:w-12 sm:h-12 animate-float" style={{ opacity: 0.2, animationDelay: '2s' }} viewBox="0 0 40 40">
        <rect x="8" y="8" width="24" height="24" rx="3" transform="rotate(15 20 20)" fill="#ffe156" fillOpacity="0.5" stroke="#e6c800" strokeWidth="2" />
      </svg>

      {/* Wavy line — top (all screens) */}
      <svg className="absolute top-[12%] left-0 w-full h-6 sm:h-8" style={{ opacity: 0.08 }} viewBox="0 0 800 20" fill="none" stroke="#7bc043" strokeWidth="2">
        <path d="M0 10 Q50 0 100 10 Q150 20 200 10 Q250 0 300 10 Q350 20 400 10 Q450 0 500 10 Q550 20 600 10 Q650 0 700 10 Q750 20 800 10" />
      </svg>

      {/* Purple dot (all screens) */}
      <svg className="absolute bottom-[20%] left-[10%] w-5 h-5 sm:w-8 sm:h-8 animate-float" style={{ opacity: 0.25, animationDelay: '0.5s' }} viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8" fill="#5a9e2f" />
      </svg>

      {/* Orange dot (all screens) */}
      <svg className="absolute top-[60%] right-[8%] w-4 h-4 sm:w-6 sm:h-6 animate-float" style={{ opacity: 0.3, animationDelay: '1.7s' }} viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6" fill="#ff8a5c" />
      </svg>

      {/* Green star (all screens) */}
      <svg className="absolute bottom-[32%] right-[18%] w-7 h-7 sm:w-10 sm:h-10 animate-float" style={{ opacity: 0.15, animationDelay: '0.8s' }} viewBox="0 0 24 24" fill="none" stroke="#a8e06c" strokeWidth="2.5">
        <path d="M12 2 L14 8 L20 8 L15 12 L17 18 L12 14 L7 18 L9 12 L4 8 L10 8Z" />
      </svg>

      {/* Zigzag — bottom (all screens) */}
      <svg className="absolute bottom-[6%] left-[15%] w-[120px] sm:w-[180px] h-6" style={{ opacity: 0.1 }} viewBox="0 0 150 20" fill="none" stroke="#4ecdc4" strokeWidth="2.5">
        <path d="M0 15 L15 5 L30 15 L45 5 L60 15 L75 5 L90 15 L105 5 L120 15 L135 5 L150 15" />
      </svg>

      {/* Cross (all screens) */}
      <svg className="absolute top-[70%] left-[5%] w-6 h-6 sm:w-10 sm:h-10 animate-float" style={{ opacity: 0.18, animationDelay: '2.5s' }} viewBox="0 0 24 24" fill="none" stroke="#7bc043" strokeWidth="3" strokeLinecap="round">
        <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
      </svg>

      {/* Arrow (all screens) */}
      <svg className="absolute bottom-[24%] right-[5%] w-10 h-7 sm:w-16 sm:h-10" style={{ opacity: 0.12 }} viewBox="0 0 60 30" fill="none" stroke="#e6c800" strokeWidth="2.5" strokeLinecap="round">
        <path d="M5 15 L50 15" /><path d="M40 5 L52 15 L40 25" />
      </svg>

      {/* Heart (all screens) */}
      <svg className="absolute top-[8%] left-[20%] w-6 h-6 sm:w-8 sm:h-8 animate-float" style={{ opacity: 0.15, animationDelay: '1.5s' }} viewBox="0 0 24 24" fill="none" stroke="#7bc043" strokeWidth="2.2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>

      {/* Triangle (all screens) */}
      <svg className="absolute bottom-[14%] left-[40%] w-7 h-7 sm:w-10 sm:h-10 animate-float" style={{ opacity: 0.1, animationDelay: '2.2s' }} viewBox="0 0 30 30" fill="none" stroke="#4ecdc4" strokeWidth="2.5" strokeLinejoin="round">
        <polygon points="15,3 28,27 2,27" />
      </svg>

      {/* Spiral (all screens) */}
      <svg className="absolute top-[25%] right-[25%] w-8 h-8 sm:w-14 sm:h-14 animate-float" style={{ opacity: 0.1, animationDelay: '3s' }} viewBox="0 0 40 40" fill="none" stroke="#8bc34a" strokeWidth="1.8">
        <path d="M20 20 C20 16 24 14 26 18 C28 22 24 26 20 24 C16 22 14 18 18 14 C22 10 28 14 28 20 C28 26 22 30 16 28" />
      </svg>

      {/* Second wavy line — bottom (all screens) */}
      <svg className="absolute bottom-[40%] left-0 w-full h-5" style={{ opacity: 0.05 }} viewBox="0 0 800 20" fill="none" stroke="#8bc34a" strokeWidth="2">
        <path d="M0 10 Q50 20 100 10 Q150 0 200 10 Q250 20 300 10 Q350 0 400 10 Q450 20 500 10 Q550 0 600 10 Q650 20 700 10 Q750 0 800 10" />
      </svg>
    </div>
  );
}
