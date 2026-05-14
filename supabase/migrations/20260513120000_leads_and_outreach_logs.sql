-- Leads + outreach_logs: schema aligned with types/lead.ts, pages/api/leads/index.ts, components/LeadCard.tsx
-- Enables RLS: users access only rows where user_id = auth.uid()

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,

  address TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,

  foreclosure_type TEXT NOT NULL
    CONSTRAINT leads_foreclosure_type_check
      CHECK (
        foreclosure_type IN (
          'NOD',
          'Lis Pendens',
          'Auction',
          'Tax Sale'
        )
      ),

  filing_date DATE NOT NULL,

  score SMALLINT NOT NULL,

  status TEXT NOT NULL DEFAULT 'new'
    CONSTRAINT leads_status_check
      CHECK (
        status IN (
          'new',
          'contacted',
          'responded',
          'offer_made',
          'dead_lead'
        )
      ),

  notes TEXT,
  street_view_url TEXT,
  county TEXT NOT NULL,

  property_value NUMERIC,
  equity_percentage NUMERIC,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_contacted TIMESTAMPTZ,

  response_received BOOLEAN,

  signals JSONB NOT NULL
    CONSTRAINT leads_signals_object_check CHECK (jsonb_typeof(signals) = 'object')
);

COMMENT ON COLUMN public.leads.signals IS
  'Matches Lead.signals: pre_foreclosure, vacant, code_violations, probate, divorce, long_term_ownership, expired_listing (booleans)';

CREATE TABLE public.outreach_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,

  method TEXT NOT NULL
    CONSTRAINT outreach_logs_method_check CHECK (method IN ('phone', 'email')),

  "timestamp" TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries (filter by owner, sort by created_at / time ordering)
CREATE INDEX idx_leads_user_id ON public.leads (user_id);
CREATE INDEX idx_leads_created_at ON public.leads (created_at DESC);

CREATE INDEX idx_outreach_logs_user_id ON public.outreach_logs (user_id);
CREATE INDEX idx_outreach_logs_created_at ON public.outreach_logs (created_at DESC);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_logs ENABLE ROW LEVEL SECURITY;

-- Leads: full CRUD scoped to row owner
CREATE POLICY "leads_select_own" ON public.leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "leads_insert_own" ON public.leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "leads_update_own" ON public.leads
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "leads_delete_own" ON public.leads
  FOR DELETE USING (auth.uid() = user_id);

-- Outreach logs: full CRUD scoped to row owner
CREATE POLICY "outreach_logs_select_own" ON public.outreach_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "outreach_logs_insert_own" ON public.outreach_logs
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "outreach_logs_update_own" ON public.outreach_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "outreach_logs_delete_own" ON public.outreach_logs
  FOR DELETE USING (auth.uid() = user_id);

-- PostgREST / client SDK (anon key + user JWT ⇒ role authenticated)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_logs TO authenticated;
