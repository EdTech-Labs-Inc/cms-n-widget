import { prisma } from '@/lib/config/database';

export const ArticlesController = {
  async approveArticle(articleId: string, userId: string) {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) throw new Error('Article not found');

    return await prisma.article.update({
      where: { id: articleId },
      data: {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: userId,
      },
    });
  },

  async unapproveArticle(articleId: string) {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) throw new Error('Article not found');

    return await prisma.article.update({
      where: { id: articleId },
      data: {
        isApproved: false,
        approvedAt: null,
        approvedBy: null,
      },
    });
  },
};
