-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "gateId" TEXT;

-- CreateTable
CREATE TABLE "Gate" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventStaffGate" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "gateId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventStaffGate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gate_eventId_idx" ON "Gate"("eventId");

-- CreateIndex
CREATE INDEX "EventStaffGate_staffId_idx" ON "EventStaffGate"("staffId");

-- CreateIndex
CREATE INDEX "EventStaffGate_gateId_idx" ON "EventStaffGate"("gateId");

-- CreateIndex
CREATE UNIQUE INDEX "EventStaffGate_staffId_gateId_key" ON "EventStaffGate"("staffId", "gateId");

-- CreateIndex
CREATE INDEX "CheckIn_gateId_idx" ON "CheckIn"("gateId");

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "Gate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gate" ADD CONSTRAINT "Gate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStaffGate" ADD CONSTRAINT "EventStaffGate_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStaffGate" ADD CONSTRAINT "EventStaffGate_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "Gate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
