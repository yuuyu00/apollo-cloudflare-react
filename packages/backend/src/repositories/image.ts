import type { PrismaClient, ImageArticle, Prisma } from "@prisma/client";
import { KVCacheHelper } from "./cache-helper";

export class ImageArticleRepository {
  private readonly cache: KVCacheHelper;

  private readonly CACHE_TTL = {
    ARTICLE_IMAGES: 7200,
  };

  constructor(
    private prisma: PrismaClient,
    kv?: KVNamespace
  ) {
    this.cache = new KVCacheHelper(kv);
  }

  async createMany(
    data: Prisma.ImageArticleCreateManyInput[]
  ): Promise<Prisma.BatchPayload> {
    const result = await this.prisma.imageArticle.createMany({ data });

    if (data.length > 0) {
      const articleIds = [...new Set(data.map((d) => d.articleId))];
      await this.cache.invalidate(
        articleIds.map((id) => `article:${id}:images`)
      );
    }

    return result;
  }

  async findByArticleId(articleId: number): Promise<ImageArticle[]> {
    return this.cache.getOrFetch(
      `article:${articleId}:images`,
      () =>
        this.prisma.imageArticle.findMany({
          where: { articleId },
          orderBy: { createdAt: "asc" },
        }),
      this.CACHE_TTL.ARTICLE_IMAGES
    );
  }

  async deleteByArticleId(articleId: number): Promise<Prisma.BatchPayload> {
    const result = await this.prisma.imageArticle.deleteMany({
      where: { articleId },
    });

    await this.cache.invalidate([`article:${articleId}:images`]);

    return result;
  }
}
