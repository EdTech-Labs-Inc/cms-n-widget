/**
 * Backfill Script: Add Organizations to Existing Data
 *
 * This script:
 * 1. Creates a default organization
 * 2. Assigns all existing users to that organization
 * 3. Assigns the first user (by creation date) as OWNER
 * 4. Assigns all articles to the default organization
 * 5. Assigns all tags to the default organization
 * 6. Adds NOT NULL constraints and foreign keys
 *
 * Run with: npx tsx scripts/backfill-organizations.ts
 */

import { PrismaClient } from '@repo/database';

const prisma = new PrismaClient();

// Configuration
const DEFAULT_ORG_NAME = process.env.DEFAULT_ORG_NAME || 'Default Organization';
const DEFAULT_ORG_SLUG = process.env.DEFAULT_ORG_SLUG || 'default-org';

// Generate random 8-character join code
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function main() {
  console.log('🚀 Starting organization backfill...\n');

  // Step 1: Check if any organizations already exist
  const existingOrgs = await prisma.organization.count();
  if (existingOrgs > 0) {
    console.log('⚠️  Organizations already exist. Skipping backfill.');
    console.log('   If you need to re-run, please delete existing organizations first.');
    return;
  }

  // Step 2: Create default organization
  console.log('📦 Creating default organization...');
  const organization = await prisma.organization.create({
    data: {
      name: DEFAULT_ORG_NAME,
      slug: DEFAULT_ORG_SLUG,
      joinCode: generateJoinCode(),
    },
  });
  console.log(`✅ Created organization: ${organization.name} (${organization.slug})`);
  console.log(`   Join Code: ${organization.joinCode}\n`);

  // Step 3: Get all existing profiles
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: 'asc' },
  });

  if (profiles.length === 0) {
    console.log('ℹ️  No profiles found. Skipping member assignment.\n');
  } else {
    console.log(`👥 Found ${profiles.length} profile(s) to assign...`);

    // Step 4: Assign all profiles to organization
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      const isFirstUser = i === 0;
      const role = isFirstUser ? 'OWNER' : 'MEMBER';

      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          profileId: profile.id,
          role,
        },
      });

      console.log(`   ✅ Assigned ${profile.email} as ${role}`);
    }
    console.log();
  }

  // Step 5: Assign all articles to organization
  const articlesCount = await prisma.article.count();
  if (articlesCount === 0) {
    console.log('ℹ️  No articles found. Skipping article assignment.\n');
  } else {
    console.log(`📝 Assigning ${articlesCount} article(s) to organization...`);
    const updatedArticles = await prisma.article.updateMany({
      where: { organizationId: null },
      data: { organizationId: organization.id },
    });
    console.log(`   ✅ Updated ${updatedArticles.count} articles\n`);
  }

  // Step 6: Assign all tags to organization
  const tagsCount = await prisma.tag.count();
  if (tagsCount === 0) {
    console.log('ℹ️  No tags found. Skipping tag assignment.\n');
  } else {
    console.log(`🏷️  Assigning ${tagsCount} tag(s) to organization...`);
    const updatedTags = await prisma.tag.updateMany({
      where: { organizationId: null },
      data: { organizationId: organization.id },
    });
    console.log(`   ✅ Updated ${updatedTags.count} tags\n`);
  }

  // Step 7: Add NOT NULL constraints and foreign keys via raw SQL
  console.log('🔒 Adding NOT NULL constraints and foreign keys...');

  try {
    // Check if any articles still have null organizationId
    const nullArticles = await prisma.article.count({
      where: { organizationId: null },
    });

    if (nullArticles > 0) {
      console.log(`   ⚠️  Warning: ${nullArticles} articles still have null organizationId`);
      console.log('   Skipping NOT NULL constraint for articles');
    } else {
      await prisma.$executeRaw`
        ALTER TABLE articles
        ADD CONSTRAINT articles_organizationId_fkey
        FOREIGN KEY ("organizationId")
        REFERENCES organizations(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE;
      `;

      await prisma.$executeRaw`
        ALTER TABLE articles
        ALTER COLUMN "organizationId"
        SET NOT NULL;
      `;
      console.log('   ✅ Added foreign key and NOT NULL constraint for articles');
    }

    // Check if any tags still have null organizationId
    const nullTags = await prisma.tag.count({
      where: { organizationId: null },
    });

    if (nullTags > 0) {
      console.log(`   ⚠️  Warning: ${nullTags} tags still have null organizationId`);
      console.log('   Skipping NOT NULL constraint for tags');
    } else {
      await prisma.$executeRaw`
        ALTER TABLE tags
        ADD CONSTRAINT tags_organizationId_fkey
        FOREIGN KEY ("organizationId")
        REFERENCES organizations(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE;
      `;

      await prisma.$executeRaw`
        ALTER TABLE tags
        ALTER COLUMN "organizationId"
        SET NOT NULL;
      `;
      console.log('   ✅ Added foreign key and NOT NULL constraint for tags');
    }
  } catch (error) {
    console.error('   ❌ Error adding constraints:', error);
    console.log('   You may need to add these constraints manually');
  }

  console.log('\n✨ Backfill complete!\n');
  console.log('Summary:');
  console.log(`  - Organization: ${organization.name}`);
  console.log(`  - Members: ${profiles.length}`);
  console.log(`  - Articles: ${articlesCount}`);
  console.log(`  - Tags: ${tagsCount}`);
  console.log(`  - Join Code: ${organization.joinCode}`);
}

main()
  .catch((error) => {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
