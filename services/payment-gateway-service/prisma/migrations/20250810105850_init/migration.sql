-- CreateEnum
CREATE TYPE "public"."PaymentIntentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REQUIRES_ACTION', 'REQUIRES_CONFIRMATION');

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
CREATE TABLE "public"."payment_intents" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."PaymentIntentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "public"."PaymentMethod" NOT NULL DEFAULT 'CREDIT_CARD',
    "clientSecret" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "failureReason" TEXT,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gatewayPaymentId" TEXT,
    "gatewayChargeId" TEXT,
    "gatewayResponse" JSONB,
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
    "paymentIntentId" TEXT,
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
CREATE UNIQUE INDEX "payment_intents_clientSecret_key" ON "public"."payment_intents"("clientSecret");

-- CreateIndex
CREATE INDEX "payment_intents_subscriptionId_idx" ON "public"."payment_intents"("subscriptionId");

-- CreateIndex
CREATE INDEX "payment_intents_userId_idx" ON "public"."payment_intents"("userId");

-- CreateIndex
CREATE INDEX "payment_intents_status_idx" ON "public"."payment_intents"("status");

-- CreateIndex
CREATE INDEX "payment_intents_createdAt_idx" ON "public"."payment_intents"("createdAt");

-- CreateIndex
CREATE INDEX "payment_intents_clientSecret_idx" ON "public"."payment_intents"("clientSecret");

-- CreateIndex
CREATE INDEX "payments_paymentIntentId_idx" ON "public"."payments"("paymentIntentId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "public"."payments"("status");

-- CreateIndex
CREATE INDEX "payments_gatewayPaymentId_idx" ON "public"."payments"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "payments_processedAt_idx" ON "public"."payments"("processedAt");

-- CreateIndex
CREATE INDEX "webhook_deliveries_paymentIntentId_idx" ON "public"."webhook_deliveries"("paymentIntentId");

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
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "public"."payment_intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "public"."payment_intents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
