-- =============================================================
-- Migration 003 — Add missing columns to events and trips
-- Safe to re-run (IF NOT EXISTS on all ALTER TABLE statements)
-- =============================================================

-- ── Events extra fields ───────────────────────────────────────

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS price_early_bird   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS price_group        NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS early_bird_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS early_bird_seats    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS early_bird_seats_sold INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS group_min_size     INTEGER,
  ADD COLUMN IF NOT EXISTS is_free            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS members_only_free  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gallery_images     TEXT[];

-- ── Trips extra fields ────────────────────────────────────────

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS early_bird_deadline   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS early_bird_seats       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS early_bird_seats_sold  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS group_min_size         INTEGER,
  ADD COLUMN IF NOT EXISTS gallery_images         TEXT[];
