# Data Migration Scripts

This directory contains data migration scripts for transforming data between schema versions.

## Available Scripts

### normalize-json-columns.ts

**Purpose:** Migrates existing data from the old schema (with JSON columns) to the new normalized schema with `VideoBubble` and `QuizQuestion` tables.

**When to use:**
- Only run this if you have existing production data with JSON columns for bubbles/questions
- Since this is a fresh migration, you likely DON'T need to run this

**Pre-requisites:**
1. Database backup
2. Install tsx: `npm install -g tsx`
3. Database connection configured in `.env`

**Usage:**
```bash
cd packages/database
npx tsx migrations/normalize-json-columns.ts
```

**What it does:**
1. Finds all `VideoOutput` records with bubbles stored as JSON
2. Creates corresponding `VideoBubble` rows in the normalized table
3. Finds all `QuizOutput` records with questions stored as JSON
4. Creates corresponding `QuizQuestion` rows in the normalized table
5. Verifies the migration was successful

**After migration:**
- Verify the data in your database
- Test your application thoroughly
- Once verified, you can optionally drop the old JSON columns

## Prisma Migrations

Standard Prisma migrations are located in `prisma/migrations/` and are applied automatically.

### 20251125121919_standardize_article_profileid

**Purpose:** Standardizes the Article model to use `profileId` instead of `userId` for consistency with other models.

**Changes:**
- Renames `articles.userId` column to `articles.profileId`
- Adds index on `articles.profileId` for better query performance

**Applied:** Automatically when running `npx prisma migrate deploy` or `npx prisma migrate dev`

## Notes

- Always backup your database before running any migrations
- Test migrations on staging environment first
- Data migration scripts are idempotent (safe to run multiple times)
- The normalize-json-columns script checks for existing data before migrating
