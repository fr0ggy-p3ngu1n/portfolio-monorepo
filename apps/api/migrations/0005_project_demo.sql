-- "Try it live" button on project cards: a deep link to the interactive part
-- of a project (e.g. the AAC board on sproutaac.org) and its button text
ALTER TABLE "Project" ADD COLUMN "demoUrl" TEXT;
ALTER TABLE "Project" ADD COLUMN "demoLabel" TEXT;
