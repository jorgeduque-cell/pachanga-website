-- Banner apaisado (2:1) para el feed de la app Club PyP.
-- Aditivo y nullable: no afecta eventos existentes ni el flyer vertical (web).
ALTER TABLE "events" ADD COLUMN "banner_url" TEXT;
