import "dotenv/config";
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import cors from "cors";
import { parseDebtReport } from "./parse.js";
import {
  createCampaignFromUpload,
  getActiveCampaignCustomers,
  deleteDebtById,
  deleteCustomerById,
} from "./campaigns.js";
import { triggerCampaignWebhook } from "./n8n.js";

const app = express();
app.use(cors());
// Reviewed customer lists are posted back as JSON; allow a generous body size.
app.use(express.json({ limit: "10mb" }));

const upload = multer({ storage: multer.memoryStorage() });

// Keep a copy of the raw uploaded workbook on disk for reference/debugging.
const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const OUT_XLSX = path.join(PUBLIC_DIR, "debt_owners.xlsx");

// Step 1 — parse only. Returns the parsed customers for on-screen review WITHOUT
// touching the database. The client edits this list (removing rows) and later
// posts the reviewed result back to /commit.
app.post("/parse", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });

    await fs.promises.mkdir(PUBLIC_DIR, { recursive: true });
    await fs.promises.writeFile(OUT_XLSX, req.file.buffer);

    const customers = parseDebtReport(req.file.buffer);
    res.json({ ok: true, fileName: req.file.originalname, customers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Step 2 — commit the reviewed list. Opens a new campaign (closing the previous
// one) from the customers the user kept on screen.
app.post("/commit", async (req, res) => {
  try {
    const { fileName, customers } = req.body;
    if (!Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ error: "No customers to commit" });
    }
    const campaign = await createCampaignFromUpload(fileName ?? null, customers);

    // Kick off the n8n process for the just-created campaign. Fire-and-forget so
    // a slow/down n8n never blocks or fails the user's upload.
    triggerCampaignWebhook(campaign.id);

    res.json({
      ok: true,
      campaignId: campaign.id,
      customersCount: campaign.total_customers,
      rows: campaign.total_debts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Return the active campaign's customers (with their debts).
app.get("/customers", async (req, res) => {
  try {
    const { customers } = await getActiveCampaignCustomers();
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Delete a single debt by its id.
app.post("/delete-debt", async (req, res) => {
  try {
    const { debtId } = req.body;
    if (typeof debtId !== "string") return res.status(400).json({ error: "Invalid payload" });
    await deleteDebtById(debtId);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Delete an entire customer by its id (debts cascade).
app.post("/delete-customer", async (req, res) => {
  try {
    const { customerId } = req.body;
    if (typeof customerId !== "string") return res.status(400).json({ error: "Invalid payload" });
    await deleteCustomerById(customerId);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
