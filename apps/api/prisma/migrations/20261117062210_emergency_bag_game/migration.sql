-- CreateTable
CREATE TABLE "GameAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'STARTED',
    "collectedItems" JSONB NOT NULL DEFAULT '[]',
    "wrongSelections" INTEGER NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "GameAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameDailyReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "rewardDate" DATE NOT NULL,
    "attemptId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameDailyReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameAttempt_userId_gameId_startedAt_idx" ON "GameAttempt"("userId", "gameId", "startedAt");

-- CreateIndex
CREATE INDEX "GameAttempt_childId_idx" ON "GameAttempt"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "GameDailyReward_attemptId_key" ON "GameDailyReward"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "GameDailyReward_userId_gameId_rewardDate_key" ON "GameDailyReward"("userId", "gameId", "rewardDate");

-- AddForeignKey
ALTER TABLE "GameAttempt" ADD CONSTRAINT "GameAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAttempt" ADD CONSTRAINT "GameAttempt_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameDailyReward" ADD CONSTRAINT "GameDailyReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameDailyReward" ADD CONSTRAINT "GameDailyReward_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "GameAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
