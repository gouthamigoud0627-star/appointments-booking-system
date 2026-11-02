import React, { useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLocale } from '../types';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'buttons' | 'list';
  className?: string;
  onSelected?: (lang: SupportedLocale) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  className = '',
  onSelected,
}) => {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  const handleSelect = (code: SupportedLocale) => {
    setLanguage(code);
    setIsOpen(false);
    if (onSelected) onSelected(code);
  };

  if (variant === 'buttons') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${className}`}>
        {languages.map((l) => {
          const isSelected = language === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => handleSelect(l.code)}
              className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between min-h-[90px] focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-lg font-bold">{l.nativeName}</span>
                {isSelected && <Check className="w-5 h-5 text-indigo-600 stroke-[3]" />}
              </div>
              <span className="text-xs text-slate-500 font-medium">{l.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-2 ${className}`}>
        {languages.map((l) => {
          const isSelected = language === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => handleSelect(l.code)}
              className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-colors text-left ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-bold'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base font-bold">{l.nativeName}</span>
                <span className="text-xs text-slate-400">({l.name})</span>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                }`}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Default: Dropdown
  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-xs"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Globe className="w-4 h-4 text-indigo-600" />
        <span>{currentLang.nativeName}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 py-1.5 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Select Language / భాష
            </div>
            <div className="py-1">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelect(l.code)}
                  className={`w-full px-3 py-2 text-xs flex items-center justify-between text-left transition-colors ${
                    language === l.code
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <span className="font-semibold block">{l.nativeName}</span>
                    <span className="text-[10px] text-slate-400 block">{l.name}</span>
                  </div>
                  {language === l.code && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
