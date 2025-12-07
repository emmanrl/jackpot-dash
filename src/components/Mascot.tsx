import React from 'react';

interface MascotProps {
  variant?: 'logo' | 'hero' | 'peeking';
  className?: string;
  size?: number | string;
}

const Mascot: React.FC<MascotProps> = ({ variant = 'logo', className = '', size = '100%' }) => {
  const id = React.useId().replace(/:/g, '');

  return (
    <svg
      viewBox={variant === 'hero' ? "0 0 240 280" : variant === 'peeking' ? "0 0 160 140" : "0 0 160 160"}
      width={size}
      height={size}
      className={`select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="LuckyWin Mascot"
    >
      <defs>
        {/* Gradients */}
        <linearGradient id={`${id}-hat`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--mascot-hat-primary)" />
          <stop offset="50%" stopColor="var(--mascot-hat-primary)" />
          <stop offset="100%" stopColor="var(--mascot-hat-secondary)" />
        </linearGradient>

        <linearGradient id={`${id}-gold`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" /> {/* yellow-200 highlight */}
          <stop offset="20%" stopColor="#facc15" /> {/* yellow-400 */}
          <stop offset="100%" stopColor="#a16207" /> {/* yellow-700 shadow */}
        </linearGradient>

        <linearGradient id={`${id}-skin`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="100%" stopColor="#fdba74" />
        </linearGradient>

        <linearGradient id={`${id}-beard`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#9a3412" /> {/* Darker orange/brown at bottom */}
        </linearGradient>

        <radialGradient id={`${id}-nose`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="100%" stopColor="#f97316" />
        </radialGradient>

        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" />
        </filter>

        <style>
          {`
            /* Animations */
            .mascot-eye-blink {
              animation: blink 4s infinite ease-in-out;
              transform-origin: center;
            }
            .mascot-float {
              animation: float 4s ease-in-out infinite;
            }
            .mascot-staff-glow {
              animation: pulse-glow 2s infinite alternate;
            }
            .mascot-wave {
              animation: wave 3s ease-in-out infinite;
              transform-origin: 70% 80%; /* Pivot near shoulder/elbow */
            }
            .mascot-mustache-twitch {
              animation: twitch 5s infinite;
              transform-origin: center;
            }
            
            /* Interactive Hover States */
            .mascot-group { transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
            
            /* Parent container hover effects handled via CSS classes or grouping */
            /* Default state subtle movement */
            
            @keyframes blink {
              0%, 48%, 52%, 100% { transform: scaleY(1); }
              50% { transform: scaleY(0.1); }
            }
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            @keyframes pulse-glow {
              from { opacity: 0.7; filter: drop-shadow(0 0 4px #facc15); transform: scale(0.95); }
              to { opacity: 1; filter: drop-shadow(0 0 12px #facc15); transform: scale(1.05); }
            }
            @keyframes wave {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(-15deg); }
            }
            @keyframes twitch {
               0%, 90%, 100% { transform: scale(1) rotate(0deg); }
               92% { transform: scale(1.02) rotate(-2deg); }
               94% { transform: scale(1.02) rotate(2deg); }
               96% { transform: scale(1) rotate(0deg); }
            }
          `}
        </style>
      </defs>

      {/* Reusable Parts */}
      {(() => {
        const Head = ({ x = 80, y = 80, scale = 1 }: { x?: number, y?: number, scale?: number }) => (
          <g transform={`translate(${x}, ${y}) scale(${scale})`}>
            {/* Beard Base - Fluffier and wider */}
            <path
              d="M-38 -10 C-55 10 -50 40 -40 55 C-30 75 -10 85 0 85 C10 85 30 75 40 55 C50 40 55 10 38 -10 Z"
              fill={`url(#${id}-beard)`}
              filter={`url(#${id}-shadow)`}
            />

            {/* Ears */}
            <path d="M-34 0 C-48 -5 -45 20 -38 25 C-35 30 -28 20 -28 15" fill={`url(#${id}-skin)`} />
            <path d="M34 0 C48 -5 45 20 38 25 C35 30 28 20 28 15" fill={`url(#${id}-skin)`} />

            {/* Face Shape */}
            <path
              d="M-32 -25 L32 -25 C38 -25 38 10 35 25 C30 50 0 55 0 55 C0 55 -30 50 -35 25 C-38 10 -38 -25 -32 -25"
              fill={`url(#${id}-skin)`}
            />

            {/* Mustache - separate for animation */}
            <g className="mascot-mustache-twitch">
              <path d="M0 38 Q-15 38 -25 48 Q-10 25 0 32 Q10 25 25 48 Q15 38 0 38" fill="#c2410c" />
            </g>

            {/* Mouth (Smile) */}
            <path d="M-12 45 Q0 55 12 45" stroke="#7c2d12" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />

            {/* Nose */}
            <ellipse cx="0" cy="20" rx="9" ry="7" fill={`url(#${id}-nose)`} />

            {/* Eyes */}
            <g className="mascot-eye-blink">
              {/* Left Eye */}
              <g transform="translate(-15, 0)">
                <ellipse rx="8" ry="9" fill="white" stroke="#e2e8f0" strokeWidth="1" />
                <circle r="4" fill="#15803d" /> {/* Iris Green */}
                <circle r="2" fill="#0f172a" /> {/* Pupil */}
                <circle cx="2" cy="-2" r="1.5" fill="white" opacity="0.8" /> {/* Highlight */}
              </g>
              {/* Right Eye */}
              <g transform="translate(15, 0)">
                <ellipse rx="8" ry="9" fill="white" stroke="#e2e8f0" strokeWidth="1" />
                <circle r="4" fill="#15803d" />
                <circle r="2" fill="#0f172a" />
                <circle cx="2" cy="-2" r="1.5" fill="white" opacity="0.8" />
              </g>
            </g>

            {/* Eyebrows - thicker and expressive */}
            <path className="mascot-eyebrow left" d="M-28 -12 Q-18 -22 -6 -12" stroke="#9a3412" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path className="mascot-eyebrow right" d="M6 -12 Q18 -22 28 -12" stroke="#9a3412" strokeWidth="4" strokeLinecap="round" fill="none" />

            {/* Hat */}
            <g transform="translate(0, -30)" className="mascot-hat">
              {/* Brim Back */}
              <path d="M-45 5 Q0 -5 45 5" fill="none" stroke="var(--mascot-tie-secondary)" strokeWidth="1" />
              {/* Top */}
              <path d="M-32 0 L-25 -55 C-10 -70 10 -70 25 -55 L32 0 Z" fill={`url(#${id}-hat)`} />
              {/* Band */}
              <path d="M-33 -15 L33 -15 L34 0 L-34 0 Z" fill="var(--mascot-hat-band)" />
              {/* Buckle */}
              <rect x="-12" y="-14" width="24" height="18" rx="3" fill={`url(#${id}-gold)`} stroke="#854d0e" strokeWidth="1" />
              <rect x="-8" y="-10" width="16" height="10" rx="1" fill="var(--mascot-hat-band)" />
              {/* Clover on Hat */}
              <g transform="translate(25, -20) rotate(15) scale(0.6)">
                <path d="M0 0 C-5 -5 -10 -5 -10 0 C-10 5 -5 5 0 10 C5 5 10 5 10 0 C10 -5 5 -5 0 0" fill="#4ade80" stroke="#166534" strokeWidth="1" />
                <path d="M0 0 C-5 -5 -5 -10 0 -10 C5 -10 5 -5 0 0" fill="#4ade80" stroke="#166534" strokeWidth="1" />
              </g>
              {/* Brim Front */}
              <path d="M-55 0 C-20 20 20 20 55 0 L60 5 C20 30 -20 30 -60 5 Z" fill={`url(#${id}-hat)`} stroke="var(--mascot-tie-secondary)" strokeWidth="0.5" />
            </g>
          </g>
        );

        if (variant === 'logo') {
          return (
            <g className="mascot-group">
              <Head x={80} y={95} scale={1.1} />
            </g>
          );
        }

        if (variant === 'peeking') {
          return (
            <g className="mascot-group">
              <g transform="rotate(-12, 80, 140) translate(0, 5)">
                <Head x={80} y={80} scale={1} />
                {/* Hands Peeking Over */}
                <g transform="translate(0, 10)">
                  <circle cx="40" cy="115" r="14" fill={`url(#${id}-skin)`} />
                  <circle cx="120" cy="115" r="14" fill={`url(#${id}-skin)`} />
                  {/* Knuckles/Fingers */}
                  <path d="M30 115 Q40 105 50 115" stroke="#cea076" strokeWidth="2" fill="none" />
                  <path d="M110 115 Q120 105 130 115" stroke="#cea076" strokeWidth="2" fill="none" />
                </g>
              </g>
            </g>
          );
        }

        if (variant === 'hero') {
          return (
            <g className="mascot-float">
              {/* Staff behind body - Rotated slightly */}
              <g transform="translate(150, 120) rotate(15)">
                <rect x="-4" y="-90" width="8" height="200" fill="#5c2e08" rx="4" />
                {/* Staff Top Gem */}
                <g transform="translate(0, -100)">
                  <circle r="18" fill={`url(#${id}-gold)`} className="mascot-staff-glow" />
                  <path d="M-10 -8 L0 -15 L10 -8 L0 12 Z" fill="#fff" opacity="0.6" />
                </g>
              </g>

              {/* Body */}
              <g transform="translate(100, 175)">
                {/* Jacket Tail */}
                <path d="M-40 -50 L-30 80 L30 80 L40 -50 Z" fill="var(--mascot-suit-shadow)" />

                {/* Torso/Vest */}
                <path d="M-35 -50 L-20 60 L20 60 L35 -50 L0 -30 Z" fill="var(--mascot-suit-secondary)" />
                <path d="M0 -30 L0 60" stroke="#000" strokeWidth="1" opacity="0.1" />

                {/* Buttons */}
                <circle cy="-15" r="3.5" fill="#fbbf24" filter={`url(#${id}-glow)`} />
                <circle cy="10" r="3.5" fill="#fbbf24" filter={`url(#${id}-glow)`} />
                <circle cy="35" r="3.5" fill="#fbbf24" filter={`url(#${id}-glow)`} />

                {/* Bowtie */}
                <path d="M-12 -42 L12 -42 L18 -48 L-18 -48 Z" fill="var(--mascot-tie-primary)" />
                <path d="M-10 -45 L10 -45 L0 -38 Z" fill="var(--mascot-tie-secondary)" />
              </g>

              <Head x={100} y={100} scale={0.95} />

              {/* Hands */}
              <g transform="translate(100, 175)">
                {/* Left Hand (Waving) */}
                <g transform="translate(-50, -10)" className="mascot-wave">
                  <path d="M0 0 C-10 10 -20 0 -15 -15 C-10 -25 0 -20 5 -10" fill={`url(#${id}-skin)`} />
                  <circle r="11" fill={`url(#${id}-skin)`} />
                </g>
                {/* Right Hand (Holding Staff) */}
                <g transform="translate(50, 10)">
                  <circle r="11" fill={`url(#${id}-skin)`} />
                  {/* Fingers wrapped */}
                  <path d="M-8 -5 Q0 5 8 -5" stroke="#cea076" strokeWidth="2" fill="none" />
                </g>
              </g>
            </g>
          );
        }
      })()}
    </svg>
  );
};

export default Mascot;
