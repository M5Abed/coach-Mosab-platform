import { create } from 'zustand'

export const useLanguageStore = create((set) => ({
  language: localStorage.getItem('coach_mosab_lang') || 'en',
  
  setLanguage: (lang) => {
    localStorage.setItem('coach_mosab_lang', lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    set({ language: lang })
  },
  
  toggleLanguage: () => {
    set((state) => {
      const nextLang = state.language === 'en' ? 'ar' : 'en'
      localStorage.setItem('coach_mosab_lang', nextLang)
      document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = nextLang
      return { language: nextLang }
    })
  }
}))

// Auto-run on store import to set initial HTML dir attributes
if (typeof document !== 'undefined') {
  const initialLang = localStorage.getItem('coach_mosab_lang') || 'en'
  document.documentElement.dir = initialLang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = initialLang
}
