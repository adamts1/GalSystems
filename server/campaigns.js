import { pool, withTransaction } from "./db.js";

// ---- small helpers -----------------------------------------------------------

// "DD/MM/YYYY" -> "YYYY-MM-DD" for a Postgres date column. Returns null if unparseable.
function toISODate(s) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(String(s || "").trim());
  if (!m) return null;
  let [, d, mo, y] = m;
  if (y.length === 2) y = "20" + y;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// "חמ 0044244" -> "0044244" (the document number, if present).
function documentNumber(reference) {
  const m = /(\d{3,})/.exec(String(reference || ""));
  return m ? m[1] : null;
}

const sumDebts = (debts) => debts.reduce((s, d) => s + (Number(d.amount) || 0), 0);

// ---- write -------------------------------------------------------------------

// Create a new campaign from a parsed upload and close all previously-active ones.
// Everything happens in a single transaction so a failure leaves the DB untouched.
export async function createCampaignFromUpload(fileName, customers) {
  return withTransaction(async (client) => {
    // Close the previous active campaign(s) — only one campaign is "active" at a time.
    await client.query("update campaigns set status = 'closed' where status = 'active'");

    const totalCustomers = customers.length;
    const totalDebts = customers.reduce((s, c) => s + c.debts.length, 0);
    const totalAmount = customers.reduce((s, c) => s + sumDebts(c.debts), 0);

    const { rows: [campaign] } = await client.query(
      `insert into campaigns (file_name, status, total_customers, total_debts, total_amount)
       values ($1, 'active', $2, $3, $4)
       returning *`,
      [fileName, totalCustomers, totalDebts, totalAmount]
    );

    for (const c of customers) {
      const customerTotal = c.total ?? sumDebts(c.debts);
      const context = c.previousBalance != null ? { previousBalance: c.previousBalance } : {};

      const { rows: [customer] } = await client.query(
        `insert into campaign_customers
           (campaign_id, external_customer_id, business_name, contact_name, phone, address, total_amount, status, context_json)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         returning id`,
        [campaign.id, c.code, c.name, c.contact, c.phone, c.address ?? null, customerTotal, "open", JSON.stringify(context)]
      );

      for (const d of c.debts) {
        await client.query(
          `insert into campaign_debts
             (campaign_customer_id, invoice_date, reference, document_number, amount, status)
           values ($1, $2, $3, $4, $5, $6)`,
          [customer.id, toISODate(d.date), d.asmachta, documentNumber(d.asmachta), d.amount, d.status]
        );
      }
    }

    return campaign;
  });
}

// ---- read --------------------------------------------------------------------

// Return the active campaign's customers (with their debts) in the shape the
// frontend expects. numeric columns come back from pg as strings, so we cast
// them to Number here.
export async function getActiveCampaignCustomers() {
  const { rows: campaigns } = await pool.query(
    "select * from campaigns where status = 'active' order by created_at desc limit 1"
  );
  const campaign = campaigns[0];
  if (!campaign) return { campaign: null, customers: [] };

  const { rows: customers } = await pool.query(
    `select id, external_customer_id, business_name, contact_name, phone, address,
            total_amount, status, context_json
       from campaign_customers
      where campaign_id = $1
      order by created_at`,
    [campaign.id]
  );

  const { rows: debts } = await pool.query(
    `select d.id, d.campaign_customer_id,
            to_char(d.invoice_date, 'DD/MM/YYYY') as date,
            d.reference, d.amount, d.status
       from campaign_debts d
       join campaign_customers c on c.id = d.campaign_customer_id
      where c.campaign_id = $1
      order by d.invoice_date, d.created_at`,
    [campaign.id]
  );

  // Group debts under their customer.
  const byCustomer = new Map();
  for (const c of customers) byCustomer.set(c.id, []);
  for (const d of debts) {
    byCustomer.get(d.campaign_customer_id)?.push({
      id: d.id,
      date: d.date,
      asmachta: d.reference,
      amount: Number(d.amount),
      status: d.status,
    });
  }

  const shaped = customers.map((c) => ({
    id: c.id,
    name: c.business_name,
    code: c.external_customer_id,
    phone: c.phone,
    contact: c.contact_name,
    address: c.address,
    total: Number(c.total_amount),
    previousBalance: c.context_json?.previousBalance,
    debts: byCustomer.get(c.id) || [],
  }));

  return { campaign, customers: shaped };
}

// ---- delete ------------------------------------------------------------------

// Recompute a campaign's roll-up totals from its current customers/debts.
async function recalcCampaignTotals(client, campaignId) {
  await client.query(
    `update campaigns set
        total_customers = (select count(*) from campaign_customers where campaign_id = $1),
        total_debts     = (select count(*) from campaign_debts d
                             join campaign_customers c on c.id = d.campaign_customer_id
                            where c.campaign_id = $1),
        total_amount    = coalesce((select sum(d.amount) from campaign_debts d
                             join campaign_customers c on c.id = d.campaign_customer_id
                            where c.campaign_id = $1), 0)
      where id = $1`,
    [campaignId]
  );
}

// Delete a single debt. If its customer is left with no debts, remove the customer too.
export async function deleteDebtById(debtId) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `delete from campaign_debts where id = $1
       returning campaign_customer_id`,
      [debtId]
    );
    if (rows.length === 0) return;
    const customerId = rows[0].campaign_customer_id;

    const { rows: [{ count }] } = await client.query(
      "select count(*)::int as count from campaign_debts where campaign_customer_id = $1",
      [customerId]
    );
    const { rows: [{ campaign_id }] } = await client.query(
      "select campaign_id from campaign_customers where id = $1",
      [customerId]
    );
    if (count === 0) {
      await client.query("delete from campaign_customers where id = $1", [customerId]);
    }
    await recalcCampaignTotals(client, campaign_id);
  });
}

// Delete a whole customer (cascades to their debts and messages).
export async function deleteCustomerById(customerId) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      "delete from campaign_customers where id = $1 returning campaign_id",
      [customerId]
    );
    if (rows.length === 0) return;
    await recalcCampaignTotals(client, rows[0].campaign_id);
  });
}
