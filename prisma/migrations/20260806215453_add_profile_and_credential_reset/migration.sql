-- AlterTable
ALTER TABLE "User" ADD COLUMN     "country" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "notifyPositions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyReferrals" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifySignals" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyWithdrawals" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "username" TEXT;

-- CreateTable
CREATE TABLE "CredentialResetCode" (
    "id" SERIAL NOT NULL,
    "codeHash" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CredentialResetCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CredentialResetCode_codeHash_key" ON "CredentialResetCode"("codeHash");

-- CreateIndex
CREATE INDEX "CredentialResetCode_userId_idx" ON "CredentialResetCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "CredentialResetCode" ADD CONSTRAINT "CredentialResetCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

