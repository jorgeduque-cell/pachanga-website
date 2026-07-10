-- Mapa de mesas del concierto (imagen que el admin sube/reemplaza semana a semana). Aditivo, nullable.
ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "map_url" TEXT;
