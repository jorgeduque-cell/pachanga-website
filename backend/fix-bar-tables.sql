-- Fix Bar Tables Script
-- Run this in Supabase SQL Editor

-- 1. Rename conflicting tables P and V (if they exist)
UPDATE "tables" SET name = 'Ñ' WHERE name = 'P' AND zone = 'BARRA' AND floor = 1;
UPDATE "tables" SET name = 'W' WHERE name = 'V' AND zone = 'BARRA' AND floor = 1;

-- 2. Update positions of all Barra Principal tables (Floor 1)
-- These positions place them above the bar label
UPDATE "tables" SET pos_x = 16, pos_y = 96 WHERE name = 'O' AND floor = 1;
UPDATE "tables" SET pos_x = 28, pos_y = 96 WHERE name = 'Q' AND floor = 1;
UPDATE "tables" SET pos_x = 40, pos_y = 96 WHERE name = 'R' AND floor = 1;
UPDATE "tables" SET pos_x = 52, pos_y = 96 WHERE name = 'S' AND floor = 1;
UPDATE "tables" SET pos_x = 64, pos_y = 96 WHERE name = 'T' AND floor = 1;
UPDATE "tables" SET pos_x = 76, pos_y = 96 WHERE name = 'U' AND floor = 1;
UPDATE "tables" SET pos_x = 88, pos_y = 96 WHERE name = 'Ñ' AND floor = 1;
UPDATE "tables" SET pos_x = 96, pos_y = 96 WHERE name = 'W' AND floor = 1;

-- 3. Verify changes
SELECT name, floor, zone, pos_x, pos_y FROM "tables" 
WHERE floor = 1 AND zone = 'BARRA' 
ORDER BY pos_x;
