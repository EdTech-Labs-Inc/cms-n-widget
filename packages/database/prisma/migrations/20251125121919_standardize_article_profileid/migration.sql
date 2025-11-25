-- AlterTable: Rename userId to profileId for consistency
ALTER TABLE "articles" RENAME COLUMN "userId" TO "profileId";

-- CreateIndex: Add index on profileId for better query performance
CREATE INDEX "articles_profileId_idx" ON "articles"("profileId");
