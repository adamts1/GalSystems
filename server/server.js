import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import cors from "cors";
import { parseDebtReport } from "./parse.js";

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const OUT_XLSX = path.join(PUBLIC_DIR, "debt_owners.xlsx");
const OUT_JSON = path.join(PUBLIC_DIR, "debt_owners.json");

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    // write xlsx to public
    await fs.promises.mkdir(PUBLIC_DIR, { recursive: true });
    await fs.promises.writeFile(OUT_XLSX, req.file.buffer);

    const customers = parseDebtReport(req.file.buffer);
    await fs.promises.writeFile(OUT_JSON, JSON.stringify(customers, null, 2));

    const debtsCount = customers.reduce((s, c) => s + c.debts.length, 0);
    res.json({ ok: true, customersCount: customers.length, rows: debtsCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Return customers JSON
app.get("/customers", async (req, res) => {
  try {
    const exists = await fs.promises.stat(OUT_JSON).then(() => true).catch(() => false);
    if (!exists) return res.json([]);
    const data = await fs.promises.readFile(OUT_JSON, "utf8");
    const customers = JSON.parse(data || "[]");
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Delete a single debt by customer name and debt index
app.post("/delete-debt", express.json(), async (req, res) => {
  try {
    const { customerName, debtIndex } = req.body;
    if (typeof customerName !== "string" || typeof debtIndex !== "number") return res.status(400).json({ error: "Invalid payload" });
    const exists = await fs.promises.stat(OUT_JSON).then(() => true).catch(() => false);
    if (!exists) return res.status(404).json({ error: "No data" });
    const data = JSON.parse(await fs.promises.readFile(OUT_JSON, "utf8") || "[]");
    const idx = data.findIndex(c => c.name === customerName);
    if (idx === -1) return res.status(404).json({ error: "Customer not found" });
    if (!Array.isArray(data[idx].debts)) return res.status(400).json({ error: "No debts" });
    if (debtIndex < 0 || debtIndex >= data[idx].debts.length) return res.status(400).json({ error: "Invalid debt index" });
    data[idx].debts.splice(debtIndex, 1);
    // if no debts left, remove the customer
    if (data[idx].debts.length === 0) data.splice(idx, 1);
    await fs.promises.writeFile(OUT_JSON, JSON.stringify(data, null, 2));
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Delete an entire customer
app.post("/delete-customer", express.json(), async (req, res) => {
  try {
    const { customerName } = req.body;
    if (typeof customerName !== "string") return res.status(400).json({ error: "Invalid payload" });
    const exists = await fs.promises.stat(OUT_JSON).then(() => true).catch(() => false);
    if (!exists) return res.status(404).json({ error: "No data" });
    const data = JSON.parse(await fs.promises.readFile(OUT_JSON, "utf8") || "[]");
    const newData = data.filter(c => c.name !== customerName);
    await fs.promises.writeFile(OUT_JSON, JSON.stringify(newData, null, 2));
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Upload server running on http://localhost:${port}`));
