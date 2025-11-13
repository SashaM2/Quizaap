"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import type { Language } from "@/lib/i18n"
import { getLanguageFromStorage, setLanguageToStorage, defaultLanguage } from "@/lib/i18n"
import { getTranslation } from "@/lib/translations"
import type { TranslationKey } from "@/lib/translations"

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedLanguage = getLanguageFromStorage()
    setLanguageState(storedLanguage)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    setLanguageToStorage(lang)
  }

  const t = (key: TranslationKey) => {
    return getTranslation(language, key)
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}

