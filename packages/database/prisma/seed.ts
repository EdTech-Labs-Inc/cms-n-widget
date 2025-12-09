import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default caption styles to seed for each organization
const DEFAULT_CAPTION_STYLES = [
  {
    name: 'Classic',
    submagicTemplate: 'jblk',
    previewImageUrl: null,
    logoUrl: null,
    logoPosition: null,
  },
  {
    name: 'Hormozi Style',
    submagicTemplate: 'Hormozi 1',
    previewImageUrl: null,
    logoUrl: null,
    logoPosition: null,
  },
  {
    name: 'Ella',
    submagicTemplate: 'Ella',
    previewImageUrl: null,
    logoUrl: null,
    logoPosition: null,
  },
  {
    name: 'Sara',
    submagicTemplate: 'Sara',
    previewImageUrl: null,
    logoUrl: null,
    logoPosition: null,
  },
  {
    name: 'Daniel',
    submagicTemplate: 'Daniel',
    previewImageUrl: null,
    logoUrl: null,
    logoPosition: null,
  },
];

async function seedCaptionStylesForOrg(organizationId: string, orgName: string) {
  console.log(`  Seeding caption styles for org: ${orgName}`);

  for (const style of DEFAULT_CAPTION_STYLES) {
    // Check if this style already exists for the org
    const existing = await prisma.captionStyle.findFirst({
      where: {
        organizationId,
        submagicTemplate: style.submagicTemplate,
      },
    });

    if (!existing) {
      await prisma.captionStyle.create({
        data: {
          ...style,
          organizationId,
        },
      });
      console.log(`    - Created: ${style.name}`);
    } else {
      console.log(`    - Exists: ${style.name}`);
    }
  }
}

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

  // Seed caption styles for all organizations
  console.log('\nSeeding caption styles for organizations...');
  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true },
  });

  if (organizations.length === 0) {
    console.log('  No organizations found, skipping caption styles seed.');
  } else {
    for (const org of organizations) {
      await seedCaptionStylesForOrg(org.id, org.name);
    }
  }

  console.log('\nSeeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
