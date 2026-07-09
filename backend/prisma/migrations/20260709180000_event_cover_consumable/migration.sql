-- Marca si el cover de un evento/promo es consumible (redimible en barra) o no. Aditivo y con default.
ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "cover_is_consumable" BOOLEAN NOT NULL DEFAULT false;
