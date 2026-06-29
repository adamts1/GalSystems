import { useState, useEffect, useRef } from "react";

// =============================================================================
//  גל-מערכות רכב (1992) בע"מ - דף נחיתה + מדיניות פרטיות
//
//  ▸ החליפו את פרטי הקשר המסומנים ב־[...] בפרטים האמיתיים (חיפוש "[הזינו").
//  ▸ הלוגו נטען מ־/public/logo.webp
//  ▸ אם הטמעתם פיקסל של פייסבוק (Meta Pixel) - ראו סעיף 5 במדיניות הפרטיות.
// =============================================================================

// סיסמת הכניסה לאזור הפרטי. שימו לב: זהו שער בצד-לקוח בלבד ואינו אבטחה אמיתית -
// הסיסמה גלויה בקוד המקור של הדף. מתאים להגבלת גישה קלה בלבד.
const PRIVATE_PASSWORD = "Gal123!";

const navBtn = { background: "none", border: "none", color: "inherit", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "inherit", padding: 0 };
const primaryBtn = { background: "var(--brand)", color: "#fff", border: "none", borderRadius: 8, padding: "13px 26px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", boxShadow: "0 6px 22px rgba(31,119,201,.30)" };
const ghostBtn = { background: "transparent", color: "var(--alum)", border: "1px solid var(--line)", borderRadius: 8, padding: "13px 26px", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" };

function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(true); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setShown(true)),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, shown];
}

function Reveal({ children, delay = 0, style }) {
  const [ref, shown] = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(18px)",
        transition: `opacity .6s ease ${delay}ms, transform .6s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [authed, setAuthed] = useState(() => {
    try { return sessionStorage.getItem("ga-auth") === "1"; } catch { return false; }
  });

  const login = () => {
    setAuthed(true);
    try { sessionStorage.setItem("ga-auth", "1"); } catch {}
  };
  const logout = () => {
    setAuthed(false);
    try { sessionStorage.removeItem("ga-auth"); } catch {}
    setView("home");
    window.scrollTo({ top: 0 });
  };
  const openLogin = () => { setView("login"); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const go = (id) => {
    if (view !== "home") {
      setView("home");
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 60);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };
  const openPrivacy = () => { setView("privacy"); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div>
      {/* NAV */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(15,22,32,.86)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)" }}>
        <nav className="ga-nav">

          <div className="ga-nav-links">
            <button className="ga-link ga-focus" onClick={() => go("about")} style={navBtn}>אודות</button>
            <button className="ga-link ga-focus" onClick={() => go("contact")} style={navBtn}>צור קשר</button>
            <button className="ga-link ga-focus" onClick={openPrivacy} style={navBtn}>מדיניות פרטיות</button>
            <button className="ga-link ga-focus" onClick={openLogin} style={navBtn}>{authed ? "אזור אישי" : "כניסה"}</button>
          </div>
            <button onClick={() => { setView("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="ga-focus" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 8 }}>
              <img src="/logo.webp" alt='גל-מערכות רכב (1992) בע"מ' style={{ height: 42, background: "#fff", borderRadius: 6, padding: "4px 8px" }} />
            </button>
        </nav>
      </header>

      {view === "privacy" ? (
        <PrivacyPage onBack={() => { setView("home"); window.scrollTo({ top: 0 }); }} />
      ) : view === "login" ? (
        authed
          ? <PrivatePage onLogout={logout} onBack={() => { setView("home"); window.scrollTo({ top: 0 }); }} />
          : <LoginPage onSuccess={login} onBack={() => { setView("home"); window.scrollTo({ top: 0 }); }} />
      ) : (
        <Home go={go} />
      )}

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--line)", background: "var(--steel)" }}>
        <div className="ga-footer-inner">
          <div style={{ maxWidth: 420 }}>
            <img src="/logo.webp" alt='גל-מערכות רכב' style={{ height: 54, background: "#fff", borderRadius: 8, padding: "6px 10px", marginBottom: 14 }} />
            <p style={{ color: "var(--alum-dim)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              ייבוא ושיווק מנועים, תיבות הילוכים, ראשי מנוע, אלטרנטורים ומתנעים - חדשים ויד שנייה.
            </p>
          </div>
          <div style={{ fontSize: 14, color: "var(--alum-dim)", lineHeight: 2 }}>
            <button className="ga-link ga-focus" onClick={() => go("contact")} style={navBtn}>צור קשר</button><br />
            <button className="ga-link ga-focus" onClick={openPrivacy} style={navBtn}>מדיניות פרטיות</button>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--line)", padding: "16px 22px", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--alum-dim)" }}>
          © {new Date().getFullYear()} גל-מערכות רכב (1992) בע"מ · כל הזכויות שמורות
        </div>
      </footer>
    </div>
  );
}

function Home({ go }) {
  return (
    <main>
      {/* HERO */}
      <section className="ga-hero-bg" style={{ position: "relative", overflow: "hidden", backgroundColor: "var(--ink)", backgroundImage: "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)", backgroundSize: "46px 46px", backgroundPosition: "center" }}>
        <div className="ga-hero-glow" style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 90% at 80% 0%, rgba(31,119,201,.18), transparent 55%), linear-gradient(180deg, rgba(15,22,32,.3), var(--ink) 92%)" }} />
        <div className="ga-hero">
          <Reveal style={{ textAlign: "center" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px, 5vw, 60px)", lineHeight: 1.08, margin: "0 0 20px", color: "var(--alum)" }}>
              גל מערכות רכב
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.75, color: "var(--alum-dim)", maxWidth: 560, margin: "0 auto 30px" }}>
              למעלה מ-30 שנה אנו מייבאים ומשווקים מנועי בנזין ודיזל, תיבות הילוכים אוטומטיות ורגילות,
              ראשי מנוע, אלטרנטורים ומתנעים - חדשים ויד שנייה - לרכבים פרטיים ומסחריים.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
              <button onClick={() => go("contact")} className="ga-btn ga-focus" style={primaryBtn}>קבלו הצעת מחיר</button>
              <button onClick={() => go("about")} className="ga-btn ga-focus" style={ghostBtn}>קצת עלינו ←</button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ background: "var(--steel)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="ga-about-grid">
          <Reveal>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--brand-lite)" }}>// אודות</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4vw,40px)", margin: "10px 0 18px" }}>שלושה עשורים של ניסיון בשטח</h2>
            <p style={{ color: "var(--alum-dim)", lineHeight: 1.8, fontSize: 16, margin: 0 }}>
              חברת גל-מערכות רכב (1992) בע"מ עוסקת בייבוא ושיווק חלקי רכב מאז שנת 1992.
              אנו מספקים פתרון מלא למוסכים, לסוחרי רכב וללקוחות פרטיים - ממנוע שלם ועד חלק בודד -
              עם דגש על מלאי זמין, התאמה מדויקת ושירות אישי.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                ["ייבוא ישיר", "אנו מייבאים ישירות, כך שתקבלו מחיר ואיכות ללא מתווכים."],
                ["חדש ויד שנייה", "מנועים וחלקים חדשים לצד מנועי יד שנייה בדוקים."],
                ["מגוון יצרנים", "התאמה למגוון רחב של דגמי רכב פרטיים ומסחריים."],
              ].map(([t, d]) => (
                <div key={t} style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", padding: "16px 18px" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 17, marginBottom: 4 }}>{t}</div>
                  <div style={{ color: "var(--alum-dim)", fontSize: 14.5, lineHeight: 1.6 }}>{d}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="ga-section">
        <Reveal>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--brand-lite)" }}>// צור קשר</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4vw,42px)", margin: "10px 0 30px" }}>צרו קשר</h2>
        </Reveal>
        <div className="ga-grid-contact">
          {[
            ["טלפון", "02-651-3484"],
            ['דוא"ל', "galsystems@gmail.com"],
            ["כתובת", "בית הדפוס 30 גבעת שאול"],
            ["שעות פעילות", "א'–ה' 08:00–17:00 · ו' 08:00–13:00"],
          ].map(([t, v]) => (
            <Reveal key={t}>
              <div style={{ border: "1px solid var(--line)", borderRadius: 14, background: "var(--panel)", padding: "22px 20px", height: "100%" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--brand-lite)", marginBottom: 10 }}>{t}</div>
                <div style={{ fontSize: 16, lineHeight: 1.6, color: "var(--alum)" }}>{v}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}

function LoginPage({ onSuccess, onBack }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (password === PRIVATE_PASSWORD) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
  };

  const field = {
    width: "100%", boxSizing: "border-box", background: "var(--ink)", color: "var(--alum)",
    border: `1px solid ${error ? "#e25" : "var(--line)"}`, borderRadius: 10, padding: "14px 16px",
    fontSize: 16, fontFamily: "var(--font-body)", outline: "none",
  };

  return (
    <main style={{ maxWidth: 440, margin: "0 auto", padding: "72px 22px 110px" }}>
      <button onClick={onBack} className="ga-link ga-focus" style={{ ...navBtn, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--brand-lite)", marginBottom: 26 }}>→ חזרה לדף הבית</button>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--brand-lite)" }}>// כניסה</span>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,5vw,40px)", margin: "10px 0 8px" }}>כניסה לאזור אישי</h1>
      <p style={{ color: "var(--alum-dim)", lineHeight: 1.8, fontSize: 15.5, margin: "0 0 26px" }}>
        אזור זה מוגן בסיסמה. הזינו את הסיסמה כדי להמשיך.
      </p>

      <form onSubmit={submit} style={{ border: "1px solid var(--line)", borderRadius: 14, background: "var(--panel)", padding: "24px 22px" }}>
        <label htmlFor="ga-pw" style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--brand-lite)", marginBottom: 10 }}>סיסמה</label>
        <input
          id="ga-pw"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (error) setError(false); }}
          className="ga-focus"
          style={field}
          autoFocus
          autoComplete="current-password"
          aria-invalid={error}
        />
        {error && (
          <p role="alert" style={{ color: "#ff8a8a", fontSize: 14, margin: "10px 0 0" }}>סיסמה שגויה. נסו שוב.</p>
        )}
        <button type="submit" className="ga-btn ga-focus" style={{ ...primaryBtn, width: "100%", marginTop: 18 }}>כניסה</button>
      </form>
    </main>
  );
}

function PrivatePage({ onLogout, onBack }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null); // { type: 'ok' | 'err', text }
  const fileRef = useRef(null);

  const base = import.meta.env.VITE_UPLOAD_URL || "http://localhost:4000";

  const fmtAmount = (n) => (typeof n === 'number' ? n.toLocaleString('he-IL') : n);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setUploadMsg({ type: 'err', text: 'בחר קובץ תחילה' }); return; }
    setUploadMsg(null);
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(base + "/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));
      setUploadMsg({ type: 'ok', text: `הועלו ${data.rows} שורות ל-${data.customersCount} לקוחות` });
      if (fileRef.current) fileRef.current.value = "";
      await fetchCustomers();
    } catch (err) {
      setUploadMsg({ type: 'err', text: 'שגיאה בהעלאה: ' + err });
    } finally {
      setUploading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(base + "/customers");
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setCustomers([]);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const deleteDebt = async (customerName, idx) => {
    if (!confirm(`להסיר חוב מס' ${idx + 1} של ${customerName}?`)) return;
    try {
      const res = await fetch(base + "/delete-debt", { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ customerName, debtIndex: idx }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Error');
      await fetchCustomers();
    } catch (err) { alert('שגיאה: ' + err); }
  };

  const deleteCustomer = async (customerName) => {
    if (!confirm(`להסיר את הלקוח "${customerName}" וכל החובות שלו?`)) return;
    try {
      const res = await fetch(base + "/delete-customer", { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ customerName }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Error');
      await fetchCustomers();
    } catch (err) { alert('שגיאה: ' + err); }
  };

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 22px 90px" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div>
          <button onClick={onBack} className="ga-link ga-focus" style={{ ...navBtn, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--brand-lite)', marginBottom: 6 }}>→ חזרה לדף הבית</button>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--brand-lite)' }}>// אזור אישי</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,4vw,30px)', margin: '6px 0 0' }}>אזור אישי</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ fontSize: 13, color: 'var(--alum-dim)' }}>העלה קובץ XLSX</label>
          <input ref={fileRef} id="debt-file" type="file" accept=".xlsx,.xls" disabled={uploading} />
          <button onClick={handleUpload} disabled={uploading} className="ga-btn ga-focus" style={ghostBtn}>{uploading ? 'מעלה...' : 'העלה'}</button>
          <button onClick={fetchCustomers} className="ga-btn ga-focus" style={ghostBtn}>רענן</button>
          <button onClick={onLogout} className="ga-btn ga-focus" style={ghostBtn}>התנתקות</button>
        </div>
      </div>

      {uploadMsg && (
        <p role="alert" style={{ margin: '0 0 14px', fontSize: 14, color: uploadMsg.type === 'ok' ? 'var(--brand-lite)' : '#ff8a8a' }}>{uploadMsg.text}</p>
      )}

      <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 14, background: 'var(--panel)' }}>
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'var(--alum-dim)' }}>לקוחות וחשבונות (הצג/מחק)</div>
          <div style={{ color: 'var(--alum-dim)' }}>{loading ? 'טוען...' : `${customers.length} לקוחות`}</div>
        </div>

        {customers.length === 0 ? (
          <div style={{ color: 'var(--alum-dim)' }}>אין לקוחות להצגה</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {customers.map((c) => (
              <div key={c.code || c.name} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 12, background: 'var(--panel2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontFamily: 'var(--font-display)' }}>
                      {c.name}{c.code && <span style={{ color: 'var(--alum-dim)', fontFamily: 'var(--font-mono)', fontSize: 13 }}> · {c.code}</span>}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 4, fontSize: 13, color: 'var(--alum-dim)' }}>
                      {c.phone && <a href={`tel:${c.phone}`} className="ga-focus" style={{ color: 'var(--brand-lite)', fontFamily: 'var(--font-mono)' }}>{c.phone}</a>}
                      {c.contact && <span>איש קשר: {c.contact}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    {c.total != null && (
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 11, color: 'var(--alum-dim)' }}>סה"כ חוב</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15 }}>{fmtAmount(c.total)} ₪</div>
                      </div>
                    )}
                    <button onClick={() => deleteCustomer(c.name)} className="ga-btn ga-focus" style={ghostBtn}>מחק לקוח</button>
                  </div>
                </div>
                <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
                  {Array.isArray(c.debts) && c.debts.length > 0 ? c.debts.map((d, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', gap: 12, alignItems: 'center', padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--panel)', fontSize: 14 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--alum-dim)' }}>{d.date}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.asmachta}</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{fmtAmount(d.amount)} ₪</span>
                      <span style={{ fontSize: 12, color: d.status === 'פתוח' ? 'var(--brand-lite)' : 'var(--alum-dim)' }}>{d.status}</span>
                      <button onClick={() => deleteDebt(c.name, i)} className="ga-btn ga-focus" style={{ ...ghostBtn, padding: '4px 8px', fontSize: 12 }}>מחק</button>
                    </div>
                  )) : (
                    <div style={{ color: 'var(--alum-dim)' }}>אין חובות</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function PrivacyPage({ onBack }) {
  const today = new Date().toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" });
  const h = { fontFamily: "var(--font-display)", fontSize: 22, margin: "34px 0 12px", color: "var(--alum)" };
  const p = { color: "var(--alum-dim)", lineHeight: 1.85, fontSize: 15.5, margin: "0 0 12px" };
  const li = { color: "var(--alum-dim)", lineHeight: 1.8, fontSize: 15.5, marginBottom: 6 };

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "56px 22px 80px" }}>
      <button onClick={onBack} className="ga-link ga-focus" style={{ ...navBtn, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--brand-lite)", marginBottom: 26 }}>→ חזרה לדף הבית</button>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--brand-lite)" }}>// מדיניות פרטיות</span>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(30px,5vw,44px)", margin: "10px 0 8px" }}>מדיניות פרטיות</h1>
      <p style={{ ...p, fontFamily: "var(--font-mono)", fontSize: 13 }}>עודכן לאחרונה: {today}</p>

      <p style={p}>
        מדיניות פרטיות זו מתארת כיצד חברת גל-מערכות רכב (1992) בע"מ ("החברה", "אנחנו") אוספת,
        משתמשת ומגנה על מידע אישי שנמסר לנו דרך אתר זה, דרך עמוד הפייסבוק שלנו ובמסגרת הקשר העסקי איתכם.
        השימוש באתר ובשירותים מהווה הסכמה למדיניות זו.
      </p>

      <h2 style={h}>1. המידע שאנו אוספים</h2>
      <p style={p}>אנו עשויים לאסוף את סוגי המידע הבאים:</p>
      <ul style={{ paddingInlineStart: 22, margin: "0 0 12px" }}>
        <li style={li}>מידע שאתם מוסרים מרצונכם - שם, מספר טלפון, כתובת דוא"ל ותוכן הפנייה, בעת יצירת קשר או בקשת הצעת מחיר.</li>
        <li style={li}>מידע על הרכב - פרטי דגם, שנת ייצור וסוג החלק המבוקש, ככל שתמסרו אותם לצורך מתן שירות.</li>
        <li style={li}>מידע טכני שנאסף אוטומטית - כתובת רשת, סוג דפדפן ומכשיר, ונתוני שימוש וגלישה באתר (לרבות באמצעות עוגיות).</li>
      </ul>

      <h2 style={h}>2. כיצד אנו משתמשים במידע</h2>
      <ul style={{ paddingInlineStart: 22, margin: "0 0 12px" }}>
        <li style={li}>מענה לפניות ומתן הצעות מחיר ושירות.</li>
        <li style={li}>ניהול הקשר העסקי וביצוע עסקאות.</li>
        <li style={li}>שיפור האתר, השירות וחוויית המשתמש.</li>
        <li style={li}>דיוור ושיווק בכפוף להסכמתכם וזכותכם להסיר עצמכם בכל עת.</li>
        <li style={li}>עמידה בדרישות הדין.</li>
      </ul>

      <h2 style={h}>3. עוגיות</h2>
      <p style={p}>
        האתר עשוי לעשות שימוש בעוגיות וטכנולוגיות דומות לצורך תפעול תקין, ניתוח שימוש ושיפור השירות.
        ניתן לחסום או למחוק עוגיות דרך הגדרות הדפדפן; חסימה עלולה לפגוע בחלק מתכונות האתר.
      </p>

      <h2 style={h}>4. שיתוף מידע עם צד שלישי</h2>
      <p style={p}>
        איננו מוכרים מידע אישי. אנו עשויים לשתף מידע עם ספקי שירות הפועלים מטעמנו (כגון אחסון אתר, דיוור וניתוח),
        וכן כאשר הדבר נדרש על פי דין או לצורך הגנה על זכויותינו. ספקים אלו מחויבים לשמור על סודיות המידע.
      </p>

      <h2 style={h}>5. פייסבוק וכלי מטא</h2>
      <p style={p}>
        אנו מנהלים עמוד עסקי בפייסבוק ועשויים לעשות שימוש בכלי פרסום ומדידה של חברת מטא
        (לרבות "פיקסל" של פייסבוק) לצורך מדידת ביצועי קמפיינים והצגת פרסומות רלוונטיות.
        כלים אלו עשויים לאסוף מידע על שימושכם בכפוף למדיניות הפרטיות של מטא. אינטראקציה עם עמוד הפייסבוק שלנו
        כפופה גם לתנאי השימוש ומדיניות הפרטיות של פייסבוק.
      </p>

      <h2 style={h}>6. אבטחת מידע</h2>
      <p style={p}>
        אנו נוקטים אמצעים סבירים לאבטחת המידע מפני גישה, שימוש או גילוי בלתי מורשים.
        עם זאת, אין אפשרות להבטיח אבטחה מוחלטת בהעברת מידע באינטרנט.
      </p>

      <h2 style={h}>7. שמירת מידע</h2>
      <p style={p}>אנו שומרים מידע אישי למשך הזמן הנדרש למטרות שלשמן נאסף או כנדרש על פי דין, ולאחר מכן נמחק או נאנונימי.</p>

      <h2 style={h}>8. זכויותיכם</h2>
      <p style={p}>
        בהתאם לחוק הגנת הפרטיות, התשמ"א-1981, עומדת לכם הזכות לעיין במידע האישי שלכם, לבקש את תיקונו או מחיקתו,
        ולחזור בכם מהסכמה לקבלת דיוור. לבקשות אלו פנו אלינו בפרטים שבהמשך.
      </p>

      <h2 style={h}>9. שינויים במדיניות</h2>
      <p style={p}>אנו רשאים לעדכן מדיניות זו מעת לעת. הגרסה המעודכנת תפורסם בעמוד זה עם תאריך העדכון.</p>

      <h2 style={h}>10. יצירת קשר בנושאי פרטיות</h2>
      <p style={p}>בכל שאלה או בקשה בנוגע למדיניות פרטיות זו ניתן לפנות אלינו:</p>
      <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", padding: "18px 20px", marginTop: 6 }}>
        <p style={{ ...p, margin: "0 0 4px" }}>גל-מערכות רכב (1992) בע"מ</p>
        <p style={{ ...p, margin: "0 0 4px" }}>טלפון: [הזינו מספר טלפון]</p>
        <p style={{ ...p, margin: "0 0 4px" }}>דוא"ל:   galsystems @gmail.com</p>
        <p style={{ ...p, margin: 0 }}>כתובת: בית הדפוס 30 גבעת שאול</p>
      </div>
    </main>
  );
}
