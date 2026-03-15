-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'SURVEY';

-- AlterTable
ALTER TABLE "satisfaction_surveys" ADD COLUMN     "qr_table" TEXT;
