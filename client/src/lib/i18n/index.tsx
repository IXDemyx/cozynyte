/**
 * Sprachwahl (Deutsch/Englisch) und Zugriff auf die Texte.
 * Die Startseiten legen die Sprache über ihre Adresse fest (`/` deutsch, `/en` englisch) – damit
 * Suchmaschinen beide Versionen sauber getrennt sehen. Überall sonst gilt die eigene Wahl bzw.
 * die Browsersprache.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HOME_PATH, languageOfPath } from "../seo";
import { de, type Dictionary } from "./de";
import { en } from "./en";

export type Language = "de" | "en";

const dictionaries: Record<Language, Dictionary> = { de, en };

function readSaved(): Language | null {
  try {
    const saved = localStorage.getItem("language");
    return saved === "de" || saved === "en" ? saved : null;
  } catch {
    return null;
  }
}

/** Sprache des Browsers (de oder en). */
export function browserLanguage(): Language {
  return navigator.language.toLowerCase().startsWith("de") ? "de" : "en";
}

interface LanguageValue {
  language: Language;
  toggleLanguage: () => void;
  t: Dictionary;
  /** Übersetzt einen Fehlercode vom Server. */
  err: (code: string) => string;
  /** Startseite in der aktuellen Sprache (`/` bzw. `/en`). */
  home: string;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const fromPath = languageOfPath(pathname);
  const [chosen, setChosen] = useState<Language>(() => readSaved() ?? browserLanguage());
  // Auf den Startseiten bestimmt die Adresse – und wird für den Rest (z. B. Räume) übernommen.
  const language = fromPath ?? chosen;

  useEffect(() => {
    if (fromPath && fromPath !== chosen) setChosen(fromPath);
  }, [fromPath, chosen]);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem("language", language);
    } catch {
      // Ohne Speicher gilt die Wahl eben nur bis zum Neuladen.
    }
  }, [language]);

  const t = dictionaries[language];
  const value: LanguageValue = {
    language,
    toggleLanguage: () => {
      const next: Language = language === "de" ? "en" : "de";
      setChosen(next);
      // Auf der Startseite: zur Startseite der anderen Sprache wechseln.
      if (fromPath) navigate(HOME_PATH[next]);
    },
    t,
    err: (code) => (code ? (t.errors[code] ?? code) : ""),
    home: HOME_PATH[language],
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("LanguageProvider fehlt");
  return value;
}
