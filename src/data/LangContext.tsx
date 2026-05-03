import React, { createContext, useContext, useState } from 'react';
import { TRANSLATIONS, Lang, T } from './i18n';

interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: T; }

const LangContext = createContext<Ctx>({ lang: 'de', setLang: () => {}, t: TRANSLATIONS.de });

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    try { return (localStorage.getItem('dinobot-lang') as Lang) || 'de'; } catch { return 'de'; }
  });
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('dinobot-lang', l); } catch {}
  };
  return (
    <LangContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
