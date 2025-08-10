-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'CRYPTOCURRENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."GatewayType" AS ENUM ('STRIPE', 'PAYPAL', 'SQUARE', 'RAZORPAY');

-- CreateEnum
CREATE TYPE "public"."WebhookEventType" AS ENUM ('PAYMENT_INTENT_CREATED', 'PAYMENT_INTENT_SUCCEEDED', 'PAYMENT_INTENT_FAILED', 'PAYMENT_INTENT_CANCELLED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED');

-- CreateEnum
CREATE TYPE "public"."WebhookDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'RETRYING', 'ABANDONED');

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gatewayPaymentId" TEXT,
    "gatewayChargeId" TEXT,
    "processingFee" INTEGER,
    "netAmount" INTEGER,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhook_deliveries" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT,
    "eventType" "public"."WebhookEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "public"."WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_gateway_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gatewayType" "public"."GatewayType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "apiKey" TEXT,
    "secretKey" TEXT,
    "webhookSecret" TEXT,
    "sandboxMode" BOOLEAN NOT NULL DEFAULT true,
    "supportedMethods" "public"."PaymentMethod"[],
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_gateway_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "public"."payments"("status");

-- CreateIndex
CREATE INDEX "payments_gatewayPaymentId_idx" ON "public"."payments"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "payments_gatewayChargeId_idx" ON "public"."payments"("gatewayChargeId");

-- CreateIndex
CREATE INDEX "payments_processedAt_idx" ON "public"."payments"("processedAt");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_idx" ON "public"."webhook_deliveries"("status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_eventType_idx" ON "public"."webhook_deliveries"("eventType");

-- CreateIndex
CREATE INDEX "webhook_deliveries_createdAt_idx" ON "public"."webhook_deliveries"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_gateway_configs_name_key" ON "public"."payment_gateway_configs"("name");

-- CreateIndex
CREATE INDEX "payment_gateway_configs_isActive_idx" ON "public"."payment_gateway_configs"("isActive");

-- CreateIndex
CREATE INDEX "payment_gateway_configs_isDefault_idx" ON "public"."payment_gateway_configs"("isDefault");

-- AddForeignKey
ALTER TABLE "public"."webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
