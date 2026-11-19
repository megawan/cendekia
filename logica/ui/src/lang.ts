// The page sets <html lang> from the language switch (shared/profile.js), so the bundle follows it: t(English, Indonesian).
export const t = (en: string, id: string): string => (document.documentElement.lang === "id" ? id : en);
