/// <reference types="vite/client" />

export const publicUrl = (path: string) => {
  const p = path.startsWith("/") ? path.slice(1) : path;
  return import.meta.env.BASE_URL + p;
};
