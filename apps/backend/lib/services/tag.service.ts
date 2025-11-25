import { prisma } from '@/lib/config/database';

/**
 * Tag Service - CRUD operations for tags
 *
 * Responsibilities:
 * - Create, read, update, delete tags
 * - Query tags by various criteria
 * - Manage the master tag list
 */
export class TagService {
  /**
   * Get all tags
   */
  async getAllTags(params?: {
    organizationId?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    // ALWAYS filter by organizationId if provided (Phase 5 org scoping)
    if (params?.organizationId) {
      where.organizationId = params.organizationId;
    }

    if (params?.category) {
      where.category = params.category;
    }

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [tags, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        take: params?.limit,
        skip: params?.offset,
      }),
      prisma.tag.count({ where }),
    ]);

    return { tags, total };
  }

  /**
   * Get a single tag by ID
   */
  async getTagById(id: string) {
    return await prisma.tag.findUnique({
      where: { id },
    });
  }

  /**
   * Get tags by IDs
   */
  async getTagsByIds(ids: string[]) {
    return await prisma.tag.findMany({
      where: {
        id: { in: ids },
      },
    });
  }

  /**
   * Create a single tag
   */
  async createTag(data: {
    name: string;
    description?: string;
    category?: string;
    organizationId: string;
  }) {
    // Check if tag with same name already exists in this organization
    // Tags are org-scoped, so unique constraint is (organizationId, name)
    const existing = await prisma.tag.findFirst({
      where: {
        name: data.name,
        organizationId: data.organizationId,
      },
    });

    if (existing) {
      throw new Error(`Tag with name "${data.name}" already exists in this organization`);
    }

    return await prisma.tag.create({
      data,
    });
  }

  /**
   * Bulk create tags
   */
  async bulkCreateTags(
    organizationId: string,
    tags: Array<{
      name: string;
      description?: string;
      category?: string;
    }>
  ) {
    const results = {
      created: [] as any[],
      skipped: [] as string[],
      errors: [] as { name: string; error: string }[],
    };

    for (const tagData of tags) {
      try {
        // Check if exists in this organization
        const existing = await prisma.tag.findFirst({
          where: {
            name: tagData.name,
            organizationId,
          },
        });

        if (existing) {
          results.skipped.push(tagData.name);
          continue;
        }

        const tag = await prisma.tag.create({
          data: {
            ...tagData,
            organizationId,
          },
        });

        results.created.push(tag);
      } catch (error) {
        results.errors.push({
          name: tagData.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Update a tag
   */
  async updateTag(
    id: string,
    organizationId: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
    }
  ) {
    // If updating name, check it doesn't conflict with existing tag in this org
    if (data.name) {
      const existing = await prisma.tag.findFirst({
        where: {
          name: data.name,
          organizationId,
          NOT: { id },
        },
      });

      if (existing) {
        throw new Error(`Tag with name "${data.name}" already exists in this organization`);
      }
    }

    return await prisma.tag.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a tag
   * Note: Cascade deletes all tag associations automatically
   */
  async deleteTag(id: string) {
    return await prisma.tag.delete({
      where: { id },
    });
  }

  /**
   * Get all unique categories
   */
  async getCategories(organizationId?: string) {
    const where: any = {};

    if (organizationId) {
      where.organizationId = organizationId;
    }

    const tags = await prisma.tag.findMany({
      where,
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return tags
      .map((t) => t.category)
      .filter((c): c is string => c !== null);
  }

  /**
   * Get tag usage statistics
   */
  async getTagStats(tagId: string) {
    const [
      audioCount,
      podcastCount,
      videoCount,
      interactivePodcastCount,
      quizCount,
    ] = await Promise.all([
      prisma.audioOutputTag.count({ where: { tagId } }),
      prisma.podcastOutputTag.count({ where: { tagId } }),
      prisma.videoOutputTag.count({ where: { tagId } }),
      prisma.interactivePodcastOutputTag.count({ where: { tagId } }),
      prisma.quizOutputTag.count({ where: { tagId } }),
    ]);

    return {
      totalUsage:
        audioCount +
        podcastCount +
        videoCount +
        interactivePodcastCount +
        quizCount,
      byType: {
        audio: audioCount,
        podcast: podcastCount,
        video: videoCount,
        interactivePodcast: interactivePodcastCount,
        quiz: quizCount,
      },
    };
  }
}

export const tagService = new TagService();
