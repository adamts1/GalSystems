// Shared inline button styles used across the app's components.
// Colors reference CSS variables defined globally (see index.html / index.css).

// Text-only link-style button (nav links, "back" links).
export const navBtn = { background: "none", border: "none", color: "inherit", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "inherit", padding: 0 };

// Filled primary call-to-action button.
export const primaryBtn = { background: "var(--brand)", color: "#fff", border: "none", borderRadius: 8, padding: "13px 26px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", boxShadow: "0 6px 22px rgba(31,119,201,.30)" };

// Outlined secondary button.
export const ghostBtn = { background: "transparent", color: "var(--alum)", border: "1px solid var(--line)", borderRadius: 8, padding: "13px 26px", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" };
