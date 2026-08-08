-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('WAITING', 'CONFIRMING', 'CONFIRMED', 'PARTIALLY_PAID', 'FAILED', 'EXPIRED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "balanceUsd" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DepositAddress" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "extraId" TEXT,
    "npPaymentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepositAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositEvent" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "payAmount" DECIMAL(38,18) NOT NULL,
    "outcomeAmount" DECIMAL(38,18),
    "outcomeCurrency" TEXT,
    "usdCredited" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "txHash" TEXT,
    "status" "DepositStatus" NOT NULL,
    "npPaymentId" TEXT NOT NULL,
    "heldReason" TEXT,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amountUsd" DECIMAL(18,2) NOT NULL,
    "kind" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DepositAddress_address_extraId_idx" ON "DepositAddress"("address", "extraId");

-- CreateIndex
CREATE UNIQUE INDEX "DepositAddress_userId_currency_key" ON "DepositAddress"("userId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "DepositEvent_npPaymentId_key" ON "DepositEvent"("npPaymentId");

-- CreateIndex
CREATE INDEX "DepositEvent_userId_createdAt_idx" ON "DepositEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_userId_createdAt_idx" ON "LedgerEntry"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_kind_refId_key" ON "LedgerEntry"("kind", "refId");

-- AddForeignKey
ALTER TABLE "DepositAddress" ADD CONSTRAINT "DepositAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositEvent" ADD CONSTRAINT "DepositEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
