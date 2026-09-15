CREATE TABLE IF NOT EXISTS "LoginAttempt" (
  "id"          TEXT     NOT NULL PRIMARY KEY,
  "ip"          TEXT     NOT NULL,
  "attemptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "LoginAttempt_ip_attemptedAt_idx"
  ON "LoginAttempt"("ip", "attemptedAt");
