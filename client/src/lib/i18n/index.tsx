/** Sprachwahl (Deutsch/Englisch) und Zugriff auf die Texte. */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { de, type Dictionary } from "./de";
import { en } from "./en";

export type Language = "de" | "en";

const dictionaries: Record<Language, Dictionary> = { de, en };

function getInitialLanguage(): Language {
  const saved = localStorage.getItem("language");
  if (saved === "de" || saved === "en") return saved;
  return navigator.language.toLowerCase().startsWith("de") ? "de" : "en";
}

interface LanguageValue {
  language: Language;
  toggleLanguage: () => void;
  t: Dictionary;
  /** Übersetzt einen Fehlercode vom Server. */
  err: (code: string) => string;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("language", language);
  }, [language]);

  const t = dictionaries[language];
  const value: LanguageValue = {
    language,
    toggleLanguage: () => setLanguage((l) => (l === "de" ? "en" : "de")),
    t,
    err: (code) => (code ? (t.errors[code] ?? code) : ""),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("LanguageProvider fehlt");
  return value;
}
