-- =============================================================================
--  Schema for the debt-collection campaigns (matches the ERD).
--  Run with:  npm run db:setup
--
--  Each upload creates a new "campaign" (a snapshot of one uploaded report) and
--  closes the previous ones. A campaign has many customers; each customer has
--  many debts and many messages (WhatsApp conversation, used later).
-- =============================================================================

-- gen_random_uuid() lives in pgcrypto (already enabled on Supabase/Neon, but be safe).
create extension if not exists pgcrypto;

create table if not exists campaigns (
  id              uuid primary key default gen_random_uuid(),
  file_name       text,
  status          text not null default 'active',   -- 'active' | 'closed'
  total_customers integer not null default 0,
  total_debts     integer not null default 0,
  total_amount    numeric(14,2) not null default 0,
  created_at      timestamptz not null default now()
);

create table if not exists campaign_customers (
  id                   uuid primary key default gen_random_uuid(),
  campaign_id          uuid not null references campaigns(id) on delete cascade,
  external_customer_id text,                          -- the code from the report (e.g. "1021")
  business_name        text,
  contact_name         text,
  phone                text,
  address              text,
  total_amount         numeric(14,2) not null default 0,
  status               text,
  context_json         jsonb,                         -- free-form extra data (e.g. previousBalance)
  last_message_at      timestamptz,
  created_at           timestamptz not null default now()
);

create table if not exists campaign_debts (
  id                   uuid primary key default gen_random_uuid(),
  campaign_customer_id uuid not null references campaign_customers(id) on delete cascade,
  invoice_date         date,
  reference            text,                          -- "אסמכתא" free text
  document_number      text,                          -- parsed document no. if available
  amount               numeric(14,2) not null default 0,
  status               text,
  created_at           timestamptz not null default now()
);

create table if not exists campaign_messages (
  id                   uuid primary key default gen_random_uuid(),
  campaign_customer_id uuid not null references campaign_customers(id) on delete cascade,
  direction            text,                          -- 'inbound' | 'outbound'
  channel              text,                          -- e.g. 'whatsapp'
  text                 text,
  intent               text,
  whatsapp_message_id  text,
  status               text,
  created_at           timestamptz not null default now()
);

-- Indexes for the common lookups (customers/debts by their parent, active campaign).
create index if not exists idx_campaign_customers_campaign on campaign_customers(campaign_id);
create index if not exists idx_campaign_debts_customer     on campaign_debts(campaign_customer_id);
create index if not exists idx_campaign_messages_customer  on campaign_messages(campaign_customer_id);
create index if not exists idx_campaigns_status            on campaigns(status);
