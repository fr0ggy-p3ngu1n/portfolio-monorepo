CREATE TABLE IF NOT EXISTS "LeaderboardEntry" (
  "id"        TEXT     NOT NULL PRIMARY KEY,
  "name"      TEXT     NOT NULL,
  "score"     INTEGER  NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "LeaderboardEntry_score_idx"
  ON "LeaderboardEntry"("score" DESC);
