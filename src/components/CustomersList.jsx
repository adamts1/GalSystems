import { ghostBtn } from "../styles";

// עיצוב סכום עם מפרידי אלפים בעברית (לדוגמה 11,063).
const fmtAmount = (n) => (typeof n === "number" ? n.toLocaleString("he-IL") : n);

// =============================================================================
//  CustomersList - הצגת רשימת לקוחות וחובותיהם, עם כפתורי הסרה.
//
//  רכיב תצוגה משותף לשני המצבים בדף האישי:
//    1) תצוגה מקדימה (לפני שמירה) - ההסרה משנה state מקומי בלבד.
//    2) הנתונים השמורים (מהמסד) - ההסרה קוראת לשרת ומוחקת מהמסד.
//  ההורה מספק את מטפלי ההסרה; הרכיב עצמו אגנוסטי למקור הנתונים.
//
//  Props:
//    customers: Array            - הלקוחות להצגה.
//    onDeleteCustomer(c, ci)     - הסרת לקוח שלם (אינדקס ci ברשימה).
//    onDeleteDebt(c, ci, d, i)   - הסרת חוב בודד (אינדקס i בתוך הלקוח).
// =============================================================================
export default function CustomersList({ customers, onDeleteCustomer, onDeleteDebt }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {customers.map((c, ci) => (
        <div key={c.id || c.code || ci} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 12, background: "var(--panel2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontFamily: "var(--font-display)" }}>
                {c.name}{c.code && <span style={{ color: "var(--alum-dim)", fontFamily: "var(--font-mono)", fontSize: 13 }}> · {c.code}</span>}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginTop: 4, fontSize: 13, color: "var(--alum-dim)" }}>
                {c.phone && <a href={`tel:${c.phone}`} className="ga-focus" style={{ color: "var(--brand-lite)", fontFamily: "var(--font-mono)" }}>{c.phone}</a>}
                {c.contact && <span>איש קשר: {c.contact}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              {c.total != null && (
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 11, color: "var(--alum-dim)" }}>סה"כ חוב</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 15 }}>{fmtAmount(c.total)} ₪</div>
                </div>
              )}
              <button onClick={() => onDeleteCustomer(c, ci)} className="ga-btn ga-focus" style={ghostBtn}>מחק לקוח</button>
            </div>
          </div>
          <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
            {Array.isArray(c.debts) && c.debts.length > 0 ? c.debts.map((d, i) => (
              <div key={d.id || i} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", gap: 12, alignItems: "center", padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, background: "var(--panel)", fontSize: 14 }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--alum-dim)" }}>{d.date}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.asmachta}</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>{fmtAmount(d.amount)} ₪</span>
                <span style={{ fontSize: 12, color: d.status === "פתוח" ? "var(--brand-lite)" : "var(--alum-dim)" }}>{d.status}</span>
                <button onClick={() => onDeleteDebt(c, ci, d, i)} className="ga-btn ga-focus" style={{ ...ghostBtn, padding: "4px 8px", fontSize: 12 }}>מחק</button>
              </div>
            )) : (
              <div style={{ color: "var(--alum-dim)" }}>אין חובות</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
