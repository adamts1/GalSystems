import XLSX from "xlsx";

// The source file is a fixed "doch1" report exported by XLSWrite. It is a
// grouped/hierarchical layout rather than a flat table:
//   - a customer header row holds only "<business name> / <code>"
//   - one or more debt line rows follow (date, status, amount, reference, ...)
//   - the first debt line also carries a free-text "פרטי לקוח" with the phone
//   - a dashed row marks the per-customer subtotal
//   - an optional "ית קודמת: <n>" row holds the previous balance
//
// Column positions are stable for this report; we still locate the header row
// dynamically and verify the labels so a layout change fails loudly.

const COLS = {
  date: "__EMPTY_26",     // תאריך
  address: "__EMPTY_31",  // כתובת
  contact: "__EMPTY_34",  // contact name (unlabeled in the header)
  balance: "__EMPTY_37",  // יתרה
  status: "__EMPTY_38",   // מצב
  amount: "__EMPTY_39",   // סכום
  asmachta: "__EMPTY_40", // אסמכתא
  details: "__EMPTY_41",  // פרטי לקוח
};

const txt = (v) => (v == null ? "" : String(v).trim());
const isDashes = (s) => /^-{3,}$/.test(s.replace(/\s/g, ""));
const isDate = (s) => /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s);

// Pull the first Israeli mobile (05x) out of free text and normalise to 05x-xxxxxxx.
export function extractPhone(text) {
  const candidates = text.match(/0\d[\d-]{7,}/g) || [];
  for (const c of candidates) {
    const d = c.replace(/\D/g, "");
    if (d.length === 10 && d.startsWith("05")) return d.slice(0, 3) + "-" + d.slice(3);
  }
  return null;
}

// Best-effort contact name from the "א.קשר <name>" portion of the details text.
function extractContactFromDetails(text) {
  const m = /א\.?\s*קשר\s+(.+?)(?:\s+פקס.*)?$/.exec(text);
  return m ? m[1].trim() : null;
}

function parseAmount(v) {
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function parseDebtReport(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

  // Find the header row (the one whose details column reads "פרטי לקוח").
  const headerIdx = rows.findIndex((r) => txt(r[COLS.details]) === "פרטי לקוח");
  if (headerIdx === -1) throw new Error("לא נמצאה שורת כותרת (פרטי לקוח) בקובץ");

  const header = rows[headerIdx];
  const expect = { [COLS.date]: "תאריך", [COLS.status]: "מצב", [COLS.amount]: "סכום", [COLS.asmachta]: "אסמכתא" };
  for (const [key, label] of Object.entries(expect)) {
    if (txt(header[key]) !== label) {
      console.warn(`Header mismatch at ${key}: expected "${label}", got "${txt(header[key])}" — layout may have changed`);
    }
  }

  const customers = [];
  let current = null;

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const date = txt(r[COLS.date]);
    const status = txt(r[COLS.status]);
    const amount = r[COLS.amount];
    const asmachta = txt(r[COLS.asmachta]);
    const details = txt(r[COLS.details]);
    const contact = txt(r[COLS.contact]);

    // Subtotal / separator row (dashes). Capture the customer total from יתרה.
    if (isDashes(details) || isDashes(asmachta)) {
      if (current) {
        const total = parseAmount(r[COLS.balance]);
        if (total != null) current.total = total;
      }
      continue;
    }

    // Previous-balance row.
    if (current && /^ית\s*קודמת/.test(details)) {
      current.previousBalance = parseAmount(details);
      continue;
    }

    // Customer header row: "<business name> / <code>" and no date.
    const headerMatch = !isDate(date) && /^(.+?)\s*\/\s*(\d+)\s*$/.exec(details);
    if (headerMatch) {
      current = {
        name: headerMatch[1].trim(),
        code: headerMatch[2],
        phone: null,
        contact: null,
        address: null,
        debts: [],
        total: null,
      };
      customers.push(current);
      continue;
    }

    // Debt line row: a real date + a numeric amount.
    const amt = parseAmount(amount);
    if (current && isDate(date) && amt != null) {
      const address = txt(r[COLS.address]);
      current.debts.push({ date, asmachta, amount: amt, status });

      if (contact && !current.contact) current.contact = contact;
      if (address && !current.address && !isDashes(address)) current.address = address;
      if (details && !isDashes(details)) {
        if (!current.phone) {
          const phone = extractPhone(details);
          if (phone) current.phone = phone;
        }
        if (!current.contact) {
          const c = extractContactFromDetails(details);
          if (c) current.contact = c;
        }
      }
    }
  }

  // Drop customers that ended up with no debts (stray header rows).
  return customers.filter((c) => c.debts.length > 0);
}
