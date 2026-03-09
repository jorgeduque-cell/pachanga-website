-- AlterTable
ALTER TABLE "tables" ADD COLUMN     "floor" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "tables_floor_zone_idx" ON "tables"("floor", "zone");
