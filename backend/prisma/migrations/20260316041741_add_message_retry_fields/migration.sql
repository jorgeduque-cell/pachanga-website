-- AlterEnum
ALTER TYPE "MessageStatus" ADD VALUE 'DEAD_LETTER';

-- AlterTable
ALTER TABLE "whatsapp_messages" ADD COLUMN     "last_retry_at" TIMESTAMP(3),
ADD COLUMN     "retry_count" INTEGER NOT NULL DEFAULT 0;
