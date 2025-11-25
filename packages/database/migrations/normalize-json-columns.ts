/**
 * Data Migration Script: Normalize JSON Columns
 *
 * This script migrates existing data from the old schema (with JSON columns)
 * to the new normalized schema with VideoBubble and QuizQuestion tables.
 *
 * ⚠️ IMPORTANT: This script is for reference only. Run it ONLY if you have
 * existing production data with JSON columns for bubbles/questions.
 *
 * Usage:
 * 1. Backup your database first!
 * 2. Run: npx tsx migrations/normalize-json-columns.ts
 * 3. Verify data integrity
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OldVideoBubble {
  timestamp: number;
  question: string;
  options: any;
  correctAnswer: any;
  explanation?: string;
}

interface OldQuizQuestion {
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK';
  prompt: string;
  stem?: string;
  options?: any;
  correctAnswer: any;
  explanation?: string;
}

async function migrateVideoBubbles() {
  console.log('Starting VideoBubble migration...');

  // Find all VideoOutputs that might have bubbles in JSON format
  // Note: This assumes the old schema had a 'bubbles' JSON column
  const videos = await prisma.$queryRaw<any[]>`
    SELECT id, bubbles
    FROM video_outputs
    WHERE bubbles IS NOT NULL
    AND jsonb_typeof(bubbles) = 'array'
  `;

  console.log(`Found ${videos.length} videos with bubble data to migrate`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const video of videos) {
    try {
      const bubbles = video.bubbles as OldVideoBubble[];

      if (!Array.isArray(bubbles) || bubbles.length === 0) {
        skippedCount++;
        continue;
      }

      // Check if bubbles already migrated
      const existingBubbles = await prisma.videoBubble.count({
        where: { videoOutputId: video.id }
      });

      if (existingBubbles > 0) {
        console.log(`Video ${video.id} already has ${existingBubbles} bubbles, skipping...`);
        skippedCount++;
        continue;
      }

      // Create VideoBubble rows
      await prisma.videoBubble.createMany({
        data: bubbles.map((bubble, index) => ({
          videoOutputId: video.id,
          appearsAt: bubble.timestamp,
          order: index,
          question: bubble.question,
          options: bubble.options,
          correctAnswer: bubble.correctAnswer,
          explanation: bubble.explanation || null,
        }))
      });

      migratedCount++;
      console.log(`✓ Migrated ${bubbles.length} bubbles for video ${video.id}`);
    } catch (error) {
      console.error(`✗ Error migrating video ${video.id}:`, error);
      throw error; // Abort on error
    }
  }

  console.log(`\nVideoBubble migration complete: ${migratedCount} migrated, ${skippedCount} skipped`);
}

async function migrateQuizQuestions() {
  console.log('\nStarting QuizQuestion migration...');

  // Find all QuizOutputs that might have questions in JSON format
  const quizzes = await prisma.$queryRaw<any[]>`
    SELECT id, questions
    FROM quiz_outputs
    WHERE questions IS NOT NULL
    AND jsonb_typeof(questions) = 'array'
  `;

  console.log(`Found ${quizzes.length} quizzes with question data to migrate`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const quiz of quizzes) {
    try {
      const questions = quiz.questions as OldQuizQuestion[];

      if (!Array.isArray(questions) || questions.length === 0) {
        skippedCount++;
        continue;
      }

      // Check if questions already migrated
      const existingQuestions = await prisma.quizQuestion.count({
        where: { quizOutputId: quiz.id }
      });

      if (existingQuestions > 0) {
        console.log(`Quiz ${quiz.id} already has ${existingQuestions} questions, skipping...`);
        skippedCount++;
        continue;
      }

      // Create QuizQuestion rows
      await prisma.quizQuestion.createMany({
        data: questions.map((question, index) => ({
          quizOutputId: quiz.id,
          order: index,
          type: question.type,
          prompt: question.prompt,
          stem: question.stem || null,
          options: question.options || null,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation || null,
        }))
      });

      migratedCount++;
      console.log(`✓ Migrated ${questions.length} questions for quiz ${quiz.id}`);
    } catch (error) {
      console.error(`✗ Error migrating quiz ${quiz.id}:`, error);
      throw error; // Abort on error
    }
  }

  console.log(`\nQuizQuestion migration complete: ${migratedCount} migrated, ${skippedCount} skipped`);
}

async function verifyMigration() {
  console.log('\nVerifying migration...');

  const videoBubbleCount = await prisma.videoBubble.count();
  const quizQuestionCount = await prisma.quizQuestion.count();

  console.log(`Total VideoBubbles: ${videoBubbleCount}`);
  console.log(`Total QuizQuestions: ${quizQuestionCount}`);

  // Check for any videos/quizzes with both JSON and normalized data
  const videosWithBoth = await prisma.$queryRaw<any[]>`
    SELECT vo.id,
           COUNT(vb.id) as bubble_count,
           jsonb_array_length(vo.bubbles) as json_bubble_count
    FROM video_outputs vo
    LEFT JOIN video_bubbles vb ON vo.id = vb."videoOutputId"
    WHERE vo.bubbles IS NOT NULL
    AND jsonb_typeof(vo.bubbles) = 'array'
    GROUP BY vo.id, vo.bubbles
    HAVING COUNT(vb.id) > 0
  `;

  if (videosWithBoth.length > 0) {
    console.log('\n⚠️  Warning: Found videos with both JSON and normalized bubble data:');
    videosWithBoth.forEach(v => {
      console.log(`  - Video ${v.id}: ${v.json_bubble_count} JSON bubbles, ${v.bubble_count} normalized bubbles`);
    });
  }

  const quizzesWithBoth = await prisma.$queryRaw<any[]>`
    SELECT qo.id,
           COUNT(qq.id) as question_count,
           jsonb_array_length(qo.questions) as json_question_count
    FROM quiz_outputs qo
    LEFT JOIN quiz_questions qq ON qo.id = qq."quizOutputId"
    WHERE qo.questions IS NOT NULL
    AND jsonb_typeof(qo.questions) = 'array'
    GROUP BY qo.id, qo.questions
    HAVING COUNT(qq.id) > 0
  `;

  if (quizzesWithBoth.length > 0) {
    console.log('\n⚠️  Warning: Found quizzes with both JSON and normalized question data:');
    quizzesWithBoth.forEach(q => {
      console.log(`  - Quiz ${q.id}: ${q.json_question_count} JSON questions, ${q.question_count} normalized questions`);
    });
  }
}

async function main() {
  console.log('=================================================');
  console.log('  Data Migration: JSON → Normalized Tables');
  console.log('=================================================\n');

  console.log('⚠️  This script will migrate existing JSON data to normalized tables.');
  console.log('⚠️  Make sure you have a database backup before proceeding!\n');

  try {
    await migrateVideoBubbles();
    await migrateQuizQuestions();
    await verifyMigration();

    console.log('\n✓ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify the migrated data in your database');
    console.log('2. Test your application with the new schema');
    console.log('3. Once verified, you can optionally drop the JSON columns:');
    console.log('   - ALTER TABLE video_outputs DROP COLUMN bubbles;');
    console.log('   - ALTER TABLE quiz_outputs DROP COLUMN questions;');

  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
