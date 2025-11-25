/**
 * Script to make a user an admin
 * Usage: npx tsx scripts/make-admin.ts <user-id>
 */

import { prisma } from "../lib/config/database";

async function makeAdmin(userId: string) {
  try {
    const profile = await prisma.profile.update({
      where: { id: userId },
      data: {
        isAdmin: true,
        accessGrantedAt: new Date(), // Auto-approve admin users
      },
    });

    console.log(`✅ Successfully made user ${userId} an admin`);
    console.log(`   Name: ${profile.fullName}`);
    console.log(`   Approved at: ${profile.accessGrantedAt}`);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2025") {
      console.error(`❌ User ${userId} not found`);
      console.log(
        "\nNote: The user must log in at least once to create their profile."
      );
    } else {
      console.error("❌ Error making user admin:", error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

const userId = process.argv[2];

if (!userId) {
  console.error("Usage: npx tsx scripts/make-admin.ts <user-id>");
  process.exit(1);
}

makeAdmin(userId);
