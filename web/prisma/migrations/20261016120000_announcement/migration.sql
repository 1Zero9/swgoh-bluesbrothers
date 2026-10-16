CREATE TABLE "Announcement" (
  "id" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "label" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "cta" TEXT NOT NULL,
  "href" TEXT NOT NULL,
  "quote" TEXT NOT NULL,
  "seconds" INTEGER NOT NULL DEFAULT 20,
  "version" INTEGER NOT NULL DEFAULT 1,
  "updatedByName" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);
