import React from 'react'
import { useLanguageStore } from '../../store/languageStore'

export function LanguageSelector({ className = "" }) {
  const { language, setLanguage } = useLanguageStore()

  return (
    <div className={`flex items-center bg-[#161616] border border-[#1F1F1F] p-0.5 rounded-lg select-none shrink-0 ${className}`}>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all duration-200 outline-none cursor-pointer ${
          language === 'en' 
            ? 'bg-[#E8FF00] text-[#0A0A0A]' 
            : 'text-[#666666] hover:text-[#F5F5F5]'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('ar')}
        className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all duration-200 outline-none cursor-pointer ${
          language === 'ar' 
            ? 'bg-[#E8FF00] text-[#0A0A0A]' 
            : 'text-[#666666] hover:text-[#F5F5F5]'
        }`}
      >
        العربية
      </button>
    </div>
  )
}

export default LanguageSelector
