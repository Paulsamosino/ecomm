// If VITE_API_URL is set (for CI or explicit dev), use it. Otherwise derive the
// backend origin from the current page so the front-end can communicate with
// a locally-running backend regardless of the user's network addressing.
const inferredOrigin = typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:3001` : "http://localhost:3001";
export const API_URL = import.meta.env.VITE_API_URL || inferredOrigin;
