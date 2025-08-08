-- CreateEnum
CREATE TYPE "public"."PaymentIntentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REQUIRES_ACTION', 'REQUIRES_CONFIRMATION');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "public"."RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."RefundReason" AS ENUM ('REQUESTED_BY_CUSTOMER', 'DUPLICATE', 'FRAUDULENT', 'SUBSCRIPTION_CANCELLED', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'CRYPTOCURRENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."GatewayType" AS ENUM ('STRIPE', 'PAYPAL', 'SQUARE', 'RAZORPAY', 'SIMULATION');

-- CreateEnum
CREATE TYPE "public"."WebhookEventType" AS ENUM ('PAYMENT_INTENT_CREATED', 'PAYMENT_INTENT_SUCCEEDED', 'PAYMENT_INTENT_FAILED', 'PAYMENT_INTENT_CANCELLED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'REFUND_CREATED', 'REFUND_SUCCEEDED', 'REFUND_FAILED');

-- CreateEnum
CREATE TYPE "public"."WebhookDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'RETRYING', 'ABANDONED');

-- CreateEnum
CREATE TYPE "public"."SimulationResult" AS ENUM ('SUCCESS', 'FAILURE_INSUFFICIENT_FUNDS', 'FAILURE_CARD_DECLINED', 'FAILURE_NETWORK_ERROR', 'FAILURE_INVALID_CARD', 'FAILURE_EXPIRED_CARD', 'FAILURE_FRAUD_DETECTED', 'DELAYED_SUCCESS', 'REQUIRES_3DS');

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
    "refundAmount" INTEGER NOT NULL DEFAULT 0,
    "isSimulated" BOOLEAN NOT NULL DEFAULT true,
    "simulatedResult" "public"."SimulationResult",
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refunds" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."RefundStatus" NOT NULL DEFAULT 'PENDING',
    "reason" "public"."RefundReason",
    "gatewayRefundId" TEXT,
    "gatewayResponse" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhook_deliveries" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT,
    "eventType" "public"."WebhookEventType" NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "headers" JSONB,
    "httpStatus" INTEGER,
    "response" TEXT,
    "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "status" "public"."WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "nextRetryAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
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

-- CreateTable
CREATE TABLE "public"."simulation_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerCondition" JSONB NOT NULL,
    "simulatedResult" "public"."SimulationResult" NOT NULL,
    "delaySeconds" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulation_rules_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "refunds_paymentId_idx" ON "public"."refunds"("paymentId");

-- CreateIndex
CREATE INDEX "refunds_status_idx" ON "public"."refunds"("status");

-- CreateIndex
CREATE INDEX "refunds_gatewayRefundId_idx" ON "public"."refunds"("gatewayRefundId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_paymentIntentId_idx" ON "public"."webhook_deliveries"("paymentIntentId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_idx" ON "public"."webhook_deliveries"("status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_eventType_idx" ON "public"."webhook_deliveries"("eventType");

-- CreateIndex
CREATE INDEX "webhook_deliveries_nextRetryAt_idx" ON "public"."webhook_deliveries"("nextRetryAt");

-- CreateIndex
CREATE INDEX "webhook_deliveries_createdAt_idx" ON "public"."webhook_deliveries"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_gateway_configs_name_key" ON "public"."payment_gateway_configs"("name");

-- CreateIndex
CREATE INDEX "payment_gateway_configs_isActive_idx" ON "public"."payment_gateway_configs"("isActive");

-- CreateIndex
CREATE INDEX "payment_gateway_configs_isDefault_idx" ON "public"."payment_gateway_configs"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "simulation_rules_name_key" ON "public"."simulation_rules"("name");

-- CreateIndex
CREATE INDEX "simulation_rules_isActive_idx" ON "public"."simulation_rules"("isActive");

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "public"."payment_intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refunds" ADD CONSTRAINT "refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "public"."payment_intents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
