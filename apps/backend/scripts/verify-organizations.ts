/**
 * Verification Script: Check Organization Backfill Results
 *
 * This script verifies:
 * 1. Default organization exists
 * 2. All users are assigned to an organization
 * 3. All articles have organizationId
 * 4. All tags have organizationId
 * 5. Foreign key constraints are in place
 *
 * Run with: npx tsx scripts/verify-organizations.ts
 */

import { PrismaClient } from '@repo/database';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying organization backfill...\n');

  // Check organizations
  const organizations = await prisma.organization.findMany();
  console.log(`📦 Organizations: ${organizations.length}`);
  organizations.forEach((org) => {
    console.log(`   - ${org.name} (${org.slug}) - Join Code: ${org.joinCode}`);
  });
  console.log();

  // Check organization members
  const members = await prisma.organizationMember.findMany({
    include: {
      profile: true,
    },
  });
  console.log(`👥 Organization Members: ${members.length}`);
  members.forEach((member) => {
    console.log(`   - ${member.profile.email} - Role: ${member.role}`);
  });
  console.log();

  // Check profiles without organization
  const profiles = await prisma.profile.findMany();
  const profilesWithoutOrg = profiles.filter(
    (profile) => !members.some((m) => m.profileId === profile.id)
  );
  if (profilesWithoutOrg.length > 0) {
    console.log(`⚠️  Profiles WITHOUT organization: ${profilesWithoutOrg.length}`);
    profilesWithoutOrg.forEach((profile) => {
      console.log(`   - ${profile.email}`);
    });
  } else {
    console.log(`✅ All profiles have organization membership`);
  }
  console.log();

  // Check articles
  const totalArticles = await prisma.article.count();
  const articlesWithOrg = await prisma.article.count({
    where: { organizationId: { not: null } },
  });
  const articlesWithoutOrg = totalArticles - articlesWithOrg;

  console.log(`📝 Articles:`);
  console.log(`   - Total: ${totalArticles}`);
  console.log(`   - With organizationId: ${articlesWithOrg}`);
  console.log(`   - Without organizationId: ${articlesWithoutOrg}`);
  if (articlesWithoutOrg === 0) {
    console.log(`   ✅ All articles assigned to organization`);
  } else {
    console.log(`   ⚠️  ${articlesWithoutOrg} articles missing organizationId`);
  }
  console.log();

  // Check tags
  const totalTags = await prisma.tag.count();
  const tagsWithOrg = await prisma.tag.count({
    where: { organizationId: { not: null } },
  });
  const tagsWithoutOrg = totalTags - tagsWithOrg;

  console.log(`🏷️  Tags:`);
  console.log(`   - Total: ${totalTags}`);
  console.log(`   - With organizationId: ${tagsWithOrg}`);
  console.log(`   - Without organizationId: ${tagsWithoutOrg}`);
  if (tagsWithoutOrg === 0) {
    console.log(`   ✅ All tags assigned to organization`);
  } else {
    console.log(`   ⚠️  ${tagsWithoutOrg} tags missing organizationId`);
  }
  console.log();

  // Check foreign key constraints (attempt to query schema)
  console.log(`🔒 Checking constraints...`);
  try {
    const constraints: any[] = await prisma.$queryRaw`
      SELECT
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name IN ('articles', 'tags')
        AND kcu.column_name IN ('organizationId')
      ORDER BY tc.table_name, tc.constraint_type;
    `;

    if (constraints.length > 0) {
      constraints.forEach((constraint) => {
        console.log(
          `   - ${constraint.table_name}.${constraint.column_name}: ${constraint.constraint_type} (${constraint.constraint_name})`
        );
      });
    } else {
      console.log(`   ⚠️  No foreign key constraints found for organizationId`);
    }
  } catch (error) {
    console.log(`   ⚠️  Could not query constraints:`, error);
  }
  console.log();

  // Summary
  console.log('📊 Summary:');
  const allGood =
    organizations.length > 0 &&
    profilesWithoutOrg.length === 0 &&
    articlesWithoutOrg === 0 &&
    tagsWithoutOrg === 0;

  if (allGood) {
    console.log('   ✅ All checks passed! Organization backfill is complete.');
  } else {
    console.log('   ⚠️  Some issues detected. Please review the output above.');
  }
}

main()
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
