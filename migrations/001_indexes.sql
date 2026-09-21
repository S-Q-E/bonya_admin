CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_created ON bot_metrics (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_created_lead ON bot_metrics (created_at DESC, is_lead) WHERE is_lead = true;
CREATE INDEX IF NOT EXISTS idx_error_log_created ON bot_error_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_updated ON instagram_leads (updated_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_leads_muted ON instagram_leads (muted_until) WHERE muted_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_username ON instagram_leads (ig_username);
CREATE INDEX IF NOT EXISTS idx_chat_session_id_desc ON n8n_chat_histories (session_id, id DESC);
CREATE INDEX IF NOT EXISTS idx_sent_messages_mid ON bot_sent_messages (message_id);
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_leads_client_name_trgm ON instagram_leads USING gin (client_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_phone_trgm ON instagram_leads USING gin (phone gin_trgm_ops);