import React, { useState } from 'react';
import { Sun, Moon, Laptop, Sparkles } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';

export interface ThemeToggleProps {
  compact?: boolean;
  showLabel?: boolean;
  className?: string;
  variant?: 'switch' | 'button' | 'compact';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  compact = false,
  showLabel = true,
  className = '',
  variant,
}) => {
  const { theme, resolvedTheme, isDark, setTheme, toggleTheme } = useTheme();
  const [justToggled, setJustToggled] = useState(false);

  const handleToggle = () => {
    setJustToggled(true);
    toggleTheme();
    setTimeout(() => setJustToggled(false), 250);
  };

  const handleSystemToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (theme === 'system') {
      // If currently on system, switch to current opposite explicit
      setTheme(isDark ? 'light' : 'dark');
    } else {
      setTheme('system');
    }
  };

  // 1. Compact / Mobile Variant
  if (compact || variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-label={isDark ? 'Dark Mode is ON. Click to switch to Light Mode.' : 'Dark Mode is OFF. Click to switch to Dark Mode.'}
          title={isDark ? 'Dark Mode: ON (Click to turn OFF)' : 'Dark Mode: OFF (Click to turn ON)'}
          onClick={handleToggle}
          className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 cursor-pointer select-none active:scale-95 ${
            isDark
              ? 'bg-slate-800 text-indigo-300 border border-indigo-700/60 shadow-sm hover:bg-slate-750 hover:text-white'
              : 'bg-amber-50 text-amber-700 border border-amber-200/90 shadow-sm hover:bg-amber-100'
          } ${justToggled ? 'scale-90' : 'hover:scale-105'}`}
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-indigo-400 fill-indigo-400/20 animate-in spin-in-90 duration-200" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20 animate-in spin-in-90 duration-200" />
          )}
          <span className="sr-only">{isDark ? 'Dark Mode is ON' : 'Dark Mode is OFF'}</span>
        </button>
      </div>
    );
  }

  // 2. Full ON/OFF Switch Component
  return (
    <div className={`relative inline-flex items-center gap-2 select-none ${className}`}>
      {/* The Interactive Switch Button */}
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? 'Dark mode is ON. Turn OFF.' : 'Dark mode is OFF. Turn ON.'}
        onClick={handleToggle}
        className={`group relative inline-flex items-center w-14 h-7 p-1 rounded-full cursor-pointer transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner ${
          isDark
            ? 'bg-indigo-600 border border-indigo-500/80 hover:bg-indigo-500'
            : 'bg-slate-200 border border-slate-300 hover:bg-slate-300/80'
        }`}
        title={`Dark Mode is currently ${isDark ? 'ON' : 'OFF'}. Click to toggle.`}
      >
        {/* Track Icons: Sun on left, Moon on right */}
        <span
          className={`absolute left-1.5 flex items-center justify-center transition-opacity duration-200 ${
            isDark ? 'opacity-40 text-indigo-200' : 'opacity-100 text-amber-600'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
        </span>

        <span
          className={`absolute right-1.5 flex items-center justify-center transition-opacity duration-200 ${
            isDark ? 'opacity-100 text-white' : 'opacity-40 text-slate-400'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
        </span>

        {/* Sliding Thumb Knob */}
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-flex items-center justify-center w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-out ${
            isDark ? 'translate-x-7 text-indigo-600' : 'translate-x-0 text-amber-500'
          }`}
        >
          {isDark ? (
            <Moon className="w-3 h-3 fill-indigo-600" />
          ) : (
            <Sun className="w-3 h-3 fill-amber-500" />
          )}
        </span>
      </button>

      {/* Explicit Status Label & Indicator (1-click clickable) */}
      {showLabel && (
        <button
          type="button"
          onClick={handleToggle}
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95 ${
            isDark
              ? 'bg-slate-800/90 text-indigo-300 border-indigo-900/60 hover:bg-slate-800 hover:text-white'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80 hover:text-slate-900'
          }`}
          title="Click to toggle Dark Mode ON/OFF"
        >
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              isDark ? 'bg-indigo-400 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="font-extrabold">
            {isDark ? 'Dark: ON' : 'Dark: OFF'}
          </span>
        </button>
      )}

      {/* Sync with OS preference helper button */}
      <button
        type="button"
        onClick={handleSystemToggle}
        title={
          theme === 'system'
            ? 'Currently synced with OS preference. Click to toggle manual mode.'
            : 'Click to sync theme with System OS preference.'
        }
        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
          theme === 'system'
            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 font-bold'
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Laptop className="w-3.5 h-3.5" />
        <span className="sr-only">Toggle system theme sync</span>
      </button>
    </div>
  );
};

export default ThemeToggle;
