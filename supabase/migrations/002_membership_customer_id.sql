-- =============================================================
-- Migration 002 — Add stripe_customer_id to memberships
-- Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- =============================================================

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Index for customer.subscription.updated / deleted lookups
CREATE INDEX IF NOT EXISTS idx_memberships_stripe_customer_id
  ON public.memberships (stripe_customer_id);
