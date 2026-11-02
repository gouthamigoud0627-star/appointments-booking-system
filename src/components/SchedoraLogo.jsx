/**
 * Schedora Official Brand Logo & App Icon System
 * 100% faithful vector implementation of the uploaded brand identity image:
 * - Calendar-shaped 'S' monogram in smooth electric blue to vibrant violet gradient
 * - Twin top binder pegs with inner cutouts
 * - Central checkmark (✓) inside the upper calendar loop
 * - Realistic 3D ribbon fold on the bottom-right loop for physical depth
 * - Single-story geometric wordmark "Schedora" in Plus Jakarta Sans
 */

import React from 'react';

/**
 * Core Schedora Vector Glyph
 * Precision-matched to user's uploaded logo image.
 */
export function SchedoraGlyph({
  size = 48,
  className = '',
  monochrome = false,
  color = '#ffffff',
  idPrefix = 'schedora',
}) {
  const primaryGradId = `${idPrefix}-pgrad`;
  const foldGradId = `${idPrefix}-fgrad`;
  const bottomGradId = `${idPrefix}-bgrad`;
  const checkGradId = `${idPrefix}-cgrad`;
  const shadowId = `${idPrefix}-shad`;
  const creaseShadowId = `${idPrefix}-cshad`;

  return (
    <svg
      viewBox="0 0 260 260"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Schedora Logo"
    >
      <defs>
        {/* Primary gradient: vivid sky blue -> royal blue -> cobalt -> violet */}
        <linearGradient id={primaryGradId} x1="18%" y1="12%" x2="82%" y2="88%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="22%" stopColor="#3B82F6" />
          <stop offset="58%" stopColor="#4F46E5" />
          <stop offset="85%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>

        {/* Checkmark gradient: vibrant royal blue */}
        <linearGradient id={checkGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>

        {/* 3D ribbon fold gradient on lower-right loop for depth */}
        <linearGradient id={foldGradId} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#4338CA" />
          <stop offset="35%" stopColor="#6D28D9" />
          <stop offset="70%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#581C87" />
        </linearGradient>

        {/* Bottom ribbon front gradient */}
        <linearGradient id={bottomGradId} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="40%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>

        {/* Crease shadow for 3D fold */}
        <linearGradient id={creaseShadowId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2E1065" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#4338CA" stopOpacity="0" />
        </linearGradient>

        {/* Ambient soft shadow */}
        <filter id={shadowId} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#1E1B4B" floodOpacity="0.18" />
        </filter>
      </defs>

      <g transform="translate(5, 5)" filter={monochrome ? undefined : `url(#${shadowId})`}>
        {/* Binder Peg Left */}
        <rect
          x="76"
          y="8"
          width="24"
          height="42"
          rx="12"
          fill={monochrome ? color : `url(#${primaryGradId})`}
        />
        <rect
          x="83"
          y="17"
          width="10"
          height="24"
          rx="5"
          fill={monochrome ? 'rgba(0,0,0,0.25)' : '#FFFFFF'}
        />

        {/* Binder Peg Right */}
        <rect
          x="160"
          y="8"
          width="24"
          height="42"
          rx="12"
          fill={monochrome ? color : `url(#${primaryGradId})`}
        />
        <rect
          x="167"
          y="17"
          width="10"
          height="24"
          rx="5"
          fill={monochrome ? 'rgba(0,0,0,0.25)' : '#FFFFFF'}
        />

        {/* Main Upper Calendar Body and Loop */}
        <path
          d="M 58 36
             C 84 32, 176 32, 202 36
             C 226 40, 238 56, 238 82
             C 238 106, 218 126, 192 130
             C 172 133, 138 133, 116 136
             C 92 139, 78 149, 78 164
             C 78 182, 98 198, 136 198
             C 174 198, 202 186, 216 172
             C 222 166, 232 166, 238 172
             C 244 178, 244 188, 236 198
             C 214 220, 176 234, 132 234
             C 74 234, 46 204, 46 166
             C 46 136, 66 116, 96 108
             L 168 102
             C 188 100, 198 92, 198 80
             C 198 68, 186 60, 156 60
             L 88 60
             C 64 60, 50 72, 50 92
             C 50 100, 42 106, 32 106
             C 20 106, 12 98, 12 84
             C 12 48, 32 38, 58 36 Z"
          fill={monochrome ? color : `url(#${primaryGradId})`}
        />

        {/* Signature 3D Fold Ribbon (Bottom-right curve wrapping into the base) */}
        <path
          d="M 116 138
             C 138 135, 182 135, 208 135
             C 234 135, 252 154, 252 178
             C 252 208, 220 234, 164 234
             C 122 234, 88 224, 60 206
             C 52 201, 50 191, 58 184
             C 66 177, 76 177, 84 183
             C 106 196, 136 202, 162 202
             C 192 202, 212 190, 212 174
             C 212 162, 198 154, 178 154
             L 122 154
             C 108 154, 102 146, 116 138 Z"
          fill={monochrome ? color : `url(#${foldGradId})`}
        />

        {/* Bottom Ribbon Front Sweep with Radiant Violet Gradient */}
        <path
          d="M 152 164
             C 182 164, 208 172, 208 184
             C 208 198, 186 212, 148 212
             L 82 212
             C 60 212, 46 200, 46 182
             C 46 170, 54 164, 66 164
             L 152 164 Z"
          fill={monochrome ? color : `url(#${bottomGradId})`}
          opacity={monochrome ? 0.9 : 0.95}
        />

        {/* Fold Shadow Crease Accent */}
        {!monochrome && (
          <path
            d="M 198 144
               C 216 152, 226 166, 224 184
               C 220 172, 208 160, 192 154
               Z"
            fill={`url(#${creaseShadowId})`}
          />
        )}

        {/* Central Bold Checkmark in Upper Counter */}
        <path
          d="M 112 114 L 136 138 L 186 86"
          stroke={monochrome ? color : `url(#${checkGradId})`}
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/**
 * Schedora App Icon Squircle
 */
export function SchedoraAppIcon({
  variant = 'gradient', // 'gradient' | 'dark' | 'light'
  size = 44,
  className = '',
  idPrefix = 'app-icon',
}) {
  const squircleRadius = Math.round(size * 0.28);

  if (variant === 'dark') {
    return (
      <div
        className={`relative inline-flex items-center justify-center bg-slate-950 border border-slate-800 shadow-md overflow-hidden shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: squircleRadius,
          background: 'linear-gradient(145deg, #131b2e 0%, #0a0f1d 100%)',
        }}
      >
        <SchedoraGlyph size={Math.round(size * 0.7)} idPrefix={`${idPrefix}-dark`} />
      </div>
    );
  }

  if (variant === 'light') {
    return (
      <div
        className={`relative inline-flex items-center justify-center bg-white border border-slate-200 shadow-sm overflow-hidden shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: squircleRadius,
        }}
      >
        <SchedoraGlyph size={Math.round(size * 0.7)} idPrefix={`${idPrefix}-light`} />
      </div>
    );
  }

  // Default: Gradient App Icon Squircle
  return (
    <div
      className={`relative inline-flex items-center justify-center shadow-lg shadow-indigo-500/25 overflow-hidden shrink-0 group ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: squircleRadius,
        background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 45%, #7C3AED 85%, #8B5CF6 100%)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-40 rounded-[inherit]"
        style={{
          background: 'radial-gradient(circle at 25% 20%, rgba(255, 255, 255, 0.8) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          boxShadow: 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.45)',
        }}
      />

      <SchedoraGlyph
        size={Math.round(size * 0.68)}
        monochrome={true}
        color="#ffffff"
        idPrefix={`${idPrefix}-main`}
      />
    </div>
  );
}

/**
 * Geometric Schedora Wordmark
 * Styled in Plus Jakarta Sans matching the uploaded image lettering.
 */
export function SchedoraWordmark({
  size = 'text-xl',
  colorClass = 'text-slate-900',
  showTagline = false,
  className = '',
}) {
  return (
    <div className={`flex flex-col select-none leading-none ${className}`}>
      <span
        className={`font-extrabold tracking-tight ${size} ${colorClass}`}
        style={{
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          letterSpacing: '-0.035em',
        }}
      >
        Schedora
      </span>
      {showTagline && (
        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mt-1">
          Smart scheduling. Simple booking.
        </span>
      )}
    </div>
  );
}

/**
 * Dora AI Assistant Avatar Badge
 */
export function DoraAvatarBadge({
  size = 44,
  pulsing = false,
  className = '',
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {pulsing && (
        <span className="absolute inset-0 rounded-full bg-indigo-500 opacity-40 animate-ping" />
      )}
      <div
        className="absolute inset-0 rounded-full p-[2.5px]"
        style={{
          background: 'linear-gradient(135deg, #38BDF8 0%, #818CF8 50%, #C084FC 100%)',
        }}
      >
        <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
          <SchedoraGlyph size={Math.round(size * 0.54)} idPrefix="dora-avatar" />
        </div>
      </div>
    </div>
  );
}

/**
 * The Complete Schedora Brand Logo
 * - variant="stacked": Exactly like the user's uploaded image! Monogram on top, "Schedora" centered below.
 * - variant="horizontal": Monogram on left, "Schedora" on right.
 * - variant="mark": Monogram icon only.
 * - variant="app-icon": Squircle icon with gradient background.
 */
export default function SchedoraLogo({
  variant = 'horizontal', // 'stacked' | 'horizontal' | 'mark' | 'app-icon' | 'image'
  size = 36,
  textSize = 'text-xl',
  textColorClass = 'text-slate-900',
  showTagline = false,
  className = '',
}) {
  if (variant === 'stacked' || variant === 'image') {
    return (
      <div className={`flex flex-col items-center justify-center text-center group ${className}`}>
        <img
          src="/schedora-logo-transparent.svg"
          alt="Schedora"
          style={{ width: size * 3, height: size * 3 }}
          className="object-contain group-hover:scale-105 transition-transform"
        />
        {showTagline && (
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mt-1">
            Smart scheduling. Simple booking.
          </span>
        )}
      </div>
    );
  }

  if (variant === 'mark') {
    return <SchedoraGlyph size={size} className={className} />;
  }

  if (variant === 'app-icon') {
    return <SchedoraAppIcon size={size} className={className} />;
  }

  // Default: Horizontal
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <SchedoraGlyph size={size} />
      <SchedoraWordmark
        size={textSize}
        colorClass={textColorClass}
        showTagline={showTagline}
      />
    </div>
  );
}
