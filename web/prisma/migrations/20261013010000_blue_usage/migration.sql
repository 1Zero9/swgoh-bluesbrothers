CREATE TABLE "BlueUsage" (
  "id" TEXT NOT NULL,
  "who" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "BlueUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BlueUsage_who_day_key" ON "BlueUsage"("who", "day");
