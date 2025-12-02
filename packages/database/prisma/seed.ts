import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding feature flags...');

  // Seed feature flags
  const featureFlags = [
    {
      key: 'support_widget_enabled',
      enabled: false,
      description: 'Enable the support chat widget on the CMS',
    },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {
        description: flag.description,
        enabled: flag.enabled,
      },
      create: flag,
    });
    console.log(`  - ${flag.key}: ${flag.enabled}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
