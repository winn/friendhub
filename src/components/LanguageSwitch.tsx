import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
      className="px-3 py-1 rounded-full border-2 border-white/20 hover:border-white/40 text-white text-sm font-medium transition-all duration-300"
    >
      {language === 'en' ? 'ไทย' : 'EN'}
    </button>
  );
}