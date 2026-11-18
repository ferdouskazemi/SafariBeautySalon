-- Prices are no longer part of the product. The columns are kept (not dropped) so old
-- data survives; new rows simply get 0. They can be dropped in a later migration.
ALTER TABLE "services" ALTER COLUMN "price" SET DEFAULT 0;
ALTER TABLE "packages" ALTER COLUMN "price" SET DEFAULT 0;
ALTER TABLE "appointments" ALTER COLUMN "price" SET DEFAULT 0;
ALTER TABLE "appointment_services" ALTER COLUMN "price" SET DEFAULT 0;
