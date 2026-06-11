-- CreateTable
CREATE TABLE IF NOT EXISTS "system_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "approval_deadline_hour" INTEGER NOT NULL DEFAULT 9,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- Seed default row
INSERT INTO "system_config" ("id", "approval_deadline_hour", "updated_at")
VALUES (1, 9, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
