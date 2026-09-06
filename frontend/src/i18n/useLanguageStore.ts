import { create } from "zustand";
import {
  type LanguageCode,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  type LanguageInfo,
} from "./languages";
import { TRANSLATIONS, type TranslationSchema } from "./translations";

const STORAGE_KEY = "medexa_preferred_language";

export function triggerGoogleTranslate(lang: LanguageCode) {
  if (typeof window === "undefined") return;

  try {
    document.documentElement.lang = lang;

    const host = window.location.hostname;
    const cookieVal = lang === "en" ? "" : `/en/${lang}`;

    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host};`;

    if (lang !== "en") {
      document.cookie = `googtrans=${cookieVal}; path=/;`;
      document.cookie = `googtrans=${cookieVal}; domain=${host}; path=/;`;
    }

    const setComboValue = () => {
      const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (combo) {
        const val = lang === "en" ? "" : lang;
        if (combo.value !== val) {
          combo.value = val;
          combo.dispatchEvent(new Event("change"));
        }
        return true;
      }
      return false;
    };

    if (!setComboValue()) {
      setTimeout(setComboValue, 200);
      setTimeout(setComboValue, 600);
      setTimeout(setComboValue, 1200);
    }
  } catch (e) {
    console.warn("Failed to trigger google translate", e);
  }
}

interface LanguageState {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: <S extends keyof TranslationSchema, K extends keyof TranslationSchema[S]>(
    section: S,
    key: K
  ) => string;
  tPortal: (key: string, fallback?: string, langOverride?: LanguageCode) => string;
  getLanguageInfo: () => LanguageInfo;
}

const getInitialLanguage = (): LanguageCode => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }
  } catch (e) {
    console.warn("Could not read language from localStorage", e);
  }
  return DEFAULT_LANGUAGE;
};

const initialLang = getInitialLanguage();
if (typeof window !== "undefined" && initialLang !== DEFAULT_LANGUAGE) {
  setTimeout(() => triggerGoogleTranslate(initialLang), 500);
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: initialLang,

  setLanguage: (lang: LanguageCode) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, lang);
      }
    } catch (e) {
      console.warn("Could not write language to localStorage", e);
    }
    set({ language: lang });
    triggerGoogleTranslate(lang);
  },

  t: <S extends keyof TranslationSchema, K extends keyof TranslationSchema[S]>(
    section: S,
    key: K
  ): string => {
    const lang = get().language;
    const currentDict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANGUAGE];
    const sectionObj = currentDict[section] as Record<string, string> | undefined;
    if (sectionObj && sectionObj[key as string] !== undefined) {
      return sectionObj[key as string];
    }
    const fallbackSection = TRANSLATIONS[DEFAULT_LANGUAGE][section] as Record<string, string> | undefined;
    return (fallbackSection && fallbackSection[key as string]) || (key as string);
  },

  tPortal: (key: string, fallback?: string, langOverride?: LanguageCode): string => {
    const lang = langOverride || get().language;
    const currentDict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANGUAGE];
    const portal = currentDict.portal as Record<string, string> | undefined;
    if (portal && portal[key]) {
      return portal[key];
    }
    const defaultPortal = TRANSLATIONS[DEFAULT_LANGUAGE].portal as Record<string, string> | undefined;
    return (defaultPortal && defaultPortal[key]) || fallback || key;
  },

  getLanguageInfo: (): LanguageInfo => {
    const lang = get().language;
    const found = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
    return found || SUPPORTED_LANGUAGES[0];
  },
}));
