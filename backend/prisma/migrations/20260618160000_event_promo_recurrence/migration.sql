-- Promos recurrentes (cubetazos, happy hours). Aditivo y nullable.
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'PROMO';

ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "start_date"            DATE,
  ADD COLUMN IF NOT EXISTS "end_date"              DATE,
  ADD COLUMN IF NOT EXISTS "recurrence_days"       TEXT,
  ADD COLUMN IF NOT EXISTS "recurrence_start_time" TEXT,
  ADD COLUMN IF NOT EXISTS "recurrence_end_time"   TEXT;
