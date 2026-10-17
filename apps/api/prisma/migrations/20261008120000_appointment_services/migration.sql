-- CreateTable
CREATE TABLE "appointment_services" (
    "appointmentId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "appointment_services_pkey" PRIMARY KEY ("appointmentId","serviceId")
);

-- CreateIndex
CREATE INDEX "appointment_services_serviceId_idx" ON "appointment_services"("serviceId");

-- AddForeignKey
ALTER TABLE "appointment_services" ADD CONSTRAINT "appointment_services_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_services" ADD CONSTRAINT "appointment_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Move existing single-service bookings into the new table before dropping the column.
INSERT INTO "appointment_services" ("appointmentId", "serviceId", "position", "price")
SELECT "id", "serviceId", 0, "price" FROM "appointments" WHERE "serviceId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_serviceId_fkey";

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "serviceId";
