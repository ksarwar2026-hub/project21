-- CreateEnum
CREATE TYPE "WhatsAppMessageType" AS ENUM ('TEXT', 'TEMPLATE');

-- CreateEnum
CREATE TYPE "WhatsAppNotificationType" AS ENUM ('ORDER_CONFIRMATION', 'PAYMENT_CONFIRMATION', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'CUSTOMER_NOTIFICATION');

-- CreateEnum
CREATE TYPE "WhatsAppNotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateTable
CREATE TABLE "WhatsAppNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "notificationType" "WhatsAppNotificationType" NOT NULL,
    "messageType" "WhatsAppMessageType" NOT NULL,
    "status" "WhatsAppNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "recipientPhone" TEXT NOT NULL,
    "textBody" TEXT,
    "templateName" TEXT,
    "templateLanguageCode" TEXT,
    "templateParameters" JSONB,
    "metaMessageId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAttemptAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),

    CONSTRAINT "WhatsAppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppNotification_metaMessageId_key" ON "WhatsAppNotification"("metaMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppNotification_idempotencyKey_key" ON "WhatsAppNotification"("idempotencyKey");

-- CreateIndex
CREATE INDEX "WhatsAppNotification_status_nextAttemptAt_idx" ON "WhatsAppNotification"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "WhatsAppNotification_orderId_notificationType_idx" ON "WhatsAppNotification"("orderId", "notificationType");

-- CreateIndex
CREATE INDEX "WhatsAppNotification_userId_createdAt_idx" ON "WhatsAppNotification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "WhatsAppNotification" ADD CONSTRAINT "WhatsAppNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppNotification" ADD CONSTRAINT "WhatsAppNotification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
