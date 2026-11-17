-- Game-specific result details; existing game attempts keep an empty object.
ALTER TABLE "GameAttempt" ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}';
