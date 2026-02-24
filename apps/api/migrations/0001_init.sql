-- Migration: 0001_init
-- Applied via: wrangler d1 migrations apply portfolio-db [--remote]

-- CreateTable: Project
CREATE TABLE IF NOT EXISTS "Project" (
    "id"          TEXT     NOT NULL PRIMARY KEY,
    "title"       TEXT     NOT NULL,
    "description" TEXT     NOT NULL,
    "url"         TEXT,
    "repoUrl"     TEXT,
    "imageUrl"    TEXT,
    "tags"        TEXT     NOT NULL DEFAULT '[]',
    "featured"    BOOLEAN  NOT NULL DEFAULT false,
    "order"       INTEGER  NOT NULL DEFAULT 0,
    "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: ContactSubmission
CREATE TABLE IF NOT EXISTS "ContactSubmission" (
    "id"        TEXT     NOT NULL PRIMARY KEY,
    "name"      TEXT     NOT NULL,
    "email"     TEXT     NOT NULL,
    "message"   TEXT     NOT NULL,
    "read"      BOOLEAN  NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
