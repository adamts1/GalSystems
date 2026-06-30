import { useState, useRef } from "react";
import { API_BASE } from "../config";
import { ghostBtn } from "../styles";

// =============================================================================
//  UploadDebts - בחירת קובץ XLSX וניתוחו לתצוגה מקדימה (ללא שמירה במסד הנתונים)
//
//  שלב 1 בתהליך: שולח את הקובץ ל־POST /parse, ומחזיר להורה את רשימת הלקוחות
//  שפוענחה דרך onParsed(). השמירה למסד הנתונים מתבצעת רק בשלב הבא (כפתור "העלה
//  למסד") לאחר שהמשתמש סקר והסיר שורות.
//
//  Props:
//    onParsed?: ({ fileName, customers }) => void  - נקרא אחרי ניתוח מוצלח.
//    disabled?: boolean                            - חוסם בחירה בזמן עיבוד אחר.
// =============================================================================
export default function UploadDebts({ onParsed, disabled }) {
  const [parsing, setParsing] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'ok' | 'err', text }
  const fileRef = useRef(null);

  const handleParse = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setMsg({ type: "err", text: "בחר קובץ תחילה" }); return; }

    setMsg(null);
    try {
      setParsing(true);
      // שולחים את הקובץ כ־multipart/form-data תחת השדה "file".
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(API_BASE + "/parse", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));

      const rows = data.customers.reduce((s, c) => s + c.debts.length, 0);
      setMsg({ type: "ok", text: `נטענו ${rows} שורות ל-${data.customers.length} לקוחות לתצוגה` });
      if (fileRef.current) fileRef.current.value = ""; // מאפסים את שדה הקובץ
      onParsed?.({ fileName: data.fileName, customers: data.customers });
    } catch (err) {
      setMsg({ type: "err", text: "שגיאה בניתוח: " + err });
    } finally {
      setParsing(false);
    }
  };

  const busy = parsing || disabled;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "var(--alum-dim)" }}>טען קובץ XLSX</label>
        <input ref={fileRef} id="debt-file" type="file" accept=".xlsx,.xls" disabled={busy} />
        <button onClick={handleParse} disabled={busy} className="ga-btn ga-focus" style={ghostBtn}>
          {parsing ? "טוען..." : "טען לתצוגה"}
        </button>
      </div>

      {/* הודעת סטטוס: ירוק להצלחה, אדום לשגיאה */}
      {msg && (
        <p role="alert" style={{ margin: "8px 0 0", fontSize: 14, color: msg.type === "ok" ? "var(--brand-lite)" : "#ff8a8a" }}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
