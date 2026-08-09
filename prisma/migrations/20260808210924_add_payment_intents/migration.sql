-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "priceUsd" DECIMAL(18,2) NOT NULL,
    "npPaymentId" TEXT NOT NULL,
    "payAddress" TEXT NOT NULL,
    "payExtraId" TEXT,
    "payCurrency" TEXT NOT NULL,
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_npPaymentId_key" ON "PaymentIntent"("npPaymentId");

-- CreateIndex
CREATE INDEX "PaymentIntent_userId_createdAt_idx" ON "PaymentIntent"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
