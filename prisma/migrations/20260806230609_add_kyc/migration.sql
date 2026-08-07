-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "KycDocumentKind" AS ENUM ('DOCUMENT_FRONT', 'DOCUMENT_BACK', 'SELFIE');

-- CreateTable
CREATE TABLE "KycSubmission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "documentType" TEXT NOT NULL,
    "livenessSimulated" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KycSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycDocument" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "kind" "KycDocumentKind" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KycDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KycSubmission_userId_createdAt_idx" ON "KycSubmission"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "KycDocument_submissionId_idx" ON "KycDocument"("submissionId");

-- AddForeignKey
ALTER TABLE "KycSubmission" ADD CONSTRAINT "KycSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycDocument" ADD CONSTRAINT "KycDocument_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "KycSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

