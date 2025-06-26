-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('ITEM', 'GENERAL');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'IN_NEGOTIATION', 'ACCEPTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('IN_PROGRESS', 'AGREED', 'FAILED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('OFFER', 'COUNTER_OFFER', 'ACCEPT', 'REJECT', 'MESSAGE');

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requestType" "RequestType" NOT NULL,
    "itemId" TEXT,
    "itemQuantity" INTEGER,
    "suggestedPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'emeralds',
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "requesterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestOffer" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "offererId" TEXT NOT NULL,
    "offeredPrice" DOUBLE PRECISION,
    "message" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestNegotiation" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "acceptedOfferId" TEXT,
    "finalPrice" DOUBLE PRECISION,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RequestNegotiation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NegotiationMessage" (
    "id" TEXT NOT NULL,
    "negotiationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "priceOffer" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NegotiationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Request_requesterId_idx" ON "Request"("requesterId");

-- CreateIndex
CREATE INDEX "Request_status_idx" ON "Request"("status");

-- CreateIndex
CREATE INDEX "Request_requestType_idx" ON "Request"("requestType");

-- CreateIndex
CREATE INDEX "Request_itemId_idx" ON "Request"("itemId");

-- CreateIndex
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");

-- CreateIndex
CREATE INDEX "RequestOffer_requestId_idx" ON "RequestOffer"("requestId");

-- CreateIndex
CREATE INDEX "RequestOffer_offererId_idx" ON "RequestOffer"("offererId");

-- CreateIndex
CREATE INDEX "RequestOffer_status_idx" ON "RequestOffer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RequestNegotiation_requestId_key" ON "RequestNegotiation"("requestId");

-- CreateIndex
CREATE INDEX "NegotiationMessage_negotiationId_idx" ON "NegotiationMessage"("negotiationId");

-- CreateIndex
CREATE INDEX "NegotiationMessage_senderId_idx" ON "NegotiationMessage"("senderId");

-- CreateIndex
CREATE INDEX "NegotiationMessage_createdAt_idx" ON "NegotiationMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MinecraftItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestOffer" ADD CONSTRAINT "RequestOffer_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestOffer" ADD CONSTRAINT "RequestOffer_offererId_fkey" FOREIGN KEY ("offererId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestNegotiation" ADD CONSTRAINT "RequestNegotiation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationMessage" ADD CONSTRAINT "NegotiationMessage_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "RequestNegotiation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationMessage" ADD CONSTRAINT "NegotiationMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
