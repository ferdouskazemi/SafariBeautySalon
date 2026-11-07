-- AlterTable
ALTER TABLE "services" ADD COLUMN "colorIndex" INTEGER NOT NULL DEFAULT 0;

-- Give the existing services different colors, in the order they were created
-- (8 = SERVICE_COLOR_COUNT in @safari/shared).
UPDATE "services"
SET "colorIndex" = ranked."n" % 8
FROM (
    SELECT "id", (ROW_NUMBER() OVER (ORDER BY "createdAt", "id") - 1) AS "n"
    FROM "services"
) AS ranked
WHERE "services"."id" = ranked."id";
