import { useState, useRef } from "react";
import { API_BASE } from "../config";
import { ghostBtn } from "../styles";

// =============================================================================
//  UploadDebts - העלאת קובץ XLSX של חובות לשרת
//
//  רכיב עצמאי שמטפל בבחירת קובץ, שליחתו ל־POST /upload, והצגת הודעת סטטוס.
//  לאחר העלאה מוצלחת מפעיל את onUploaded() כדי שההורה ירענן את רשימת הלקוחות.
//
//  Props:
//    onUploaded?: () => void  - נקרא אחרי העלאה מוצלחת (לרענון הרשימה).
// =============================================================================
export default function UploadDebts({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'ok' | 'err', text }
  const fileRef = useRef(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setMsg({ type: "err", text: "בחר קובץ תחילה" }); return; }

    setMsg(null);
    try {
      setUploading(true);
      // שולחים את הקובץ כ־multipart/form-data תחת השדה "file".
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(API_BASE + "/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));

      setMsg({ type: "ok", text: `הועלו ${data.rows} שורות ל-${data.customersCount} לקוחות` });
      if (fileRef.current) fileRef.current.value = ""; // מאפסים את שדה הקובץ
      onUploaded?.(); // מודיעים להורה לרענן את הרשימה
    } catch (err) {
      setMsg({ type: "err", text: "שגיאה בהעלאה: " + err });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "var(--alum-dim)" }}>העלה קובץ XLSX</label>
        <input ref={fileRef} id="debt-file" type="file" accept=".xlsx,.xls" disabled={uploading} />
        <button onClick={handleUpload} disabled={uploading} className="ga-btn ga-focus" style={ghostBtn}>
          {uploading ? "מעלה..." : "העלה"}
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
