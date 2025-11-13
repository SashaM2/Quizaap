export type Language = "pt" | "en" | "es"

export const languages: { code: Language; name: string; flag: string }[] = [
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
]

export const defaultLanguage: Language = "pt"

export function getLanguageFromStorage(): Language {
  if (typeof window === "undefined") return defaultLanguage
  const stored = localStorage.getItem("language")
  return (stored as Language) || defaultLanguage
}

export function setLanguageToStorage(language: Language): void {
  if (typeof window === "undefined") return
  localStorage.setItem("language", language)
}

