-- CreateTable
CREATE TABLE "satisfaction_surveys" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "music_rating" INTEGER NOT NULL,
    "service_rating" INTEGER NOT NULL,
    "ambience_rating" INTEGER NOT NULL,
    "hygiene_rating" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "satisfaction_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "satisfaction_surveys_customer_id_idx" ON "satisfaction_surveys"("customer_id");

-- CreateIndex
CREATE INDEX "satisfaction_surveys_created_at_idx" ON "satisfaction_surveys"("created_at");

-- AddForeignKey
ALTER TABLE "satisfaction_surveys" ADD CONSTRAINT "satisfaction_surveys_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
