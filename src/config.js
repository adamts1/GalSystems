// Base URL of the backend (Express server in /server).
// Override in production via the VITE_UPLOAD_URL env var; defaults to the
// local dev server started with `npm run server`.
export const API_BASE = import.meta.env.VITE_UPLOAD_URL || "http://localhost:4000";
