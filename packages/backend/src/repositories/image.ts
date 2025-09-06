import type { PrismaClient, ImageArticle, Prisma } from "@prisma/client";

export class ImageArticleRepository {
  constructor(private prisma: PrismaClient) {}

  async createMany(
    data: Prisma.ImageArticleCreateManyInput[]
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.imageArticle.createMany({ data });
  }

  async findByArticleId(articleId: number): Promise<ImageArticle[]> {
    return this.prisma.imageArticle.findMany({
      where: { articleId },
      orderBy: { createdAt: "asc" },
    });
  }

  async deleteByArticleId(articleId: number): Promise<Prisma.BatchPayload> {
    return this.prisma.imageArticle.deleteMany({
      where: { articleId },
    });
  }
}
