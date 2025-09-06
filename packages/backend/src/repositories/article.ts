import { PrismaClient, Article, Prisma } from "@prisma/client";
import { KVCacheHelper } from "./cache-helper";

export class ArticleRepository {
  private readonly cache: KVCacheHelper;

  private readonly CACHE_TTL = {
    LIST: 3600,
    SINGLE: 7200,
    USER_LIST: 1800,
  };

  constructor(
    private prisma: PrismaClient,
    kv?: KVNamespace
  ) {
    this.cache = new KVCacheHelper(kv);
  }

  async findById(id: number): Promise<Article | null> {
    return this.cache.getOrFetch(
      `article:${id}`,
      () => this.prisma.article.findUnique({ where: { id } }),
      this.CACHE_TTL.SINGLE
    );
  }

  async findMany(args?: {
    where?: Prisma.ArticleWhereInput;
    orderBy?: Prisma.ArticleOrderByWithRelationInput;
    take?: number;
    skip?: number;
  }): Promise<Article[]> {
    if (!args || Object.keys(args).length === 0) {
      return this.cache.getOrFetch(
        "articles:all",
        () =>
          this.prisma.article.findMany({
            orderBy: { createdAt: "desc" },
          }),
        this.CACHE_TTL.LIST
      );
    }
    return this.prisma.article.findMany(args);
  }

  async create(data: Prisma.ArticleCreateInput): Promise<Article> {
    const article = await this.prisma.article.create({ data });

    await this.cache.invalidate([
      "articles:all",
      `user:${article.userId}:articles`,
    ]);

    return article;
  }

  async update(id: number, data: Prisma.ArticleUpdateInput): Promise<Article> {
    const article = await this.prisma.article.update({ where: { id }, data });

    await this.cache.invalidate([
      `article:${id}`,
      "articles:all",
      `user:${article.userId}:articles`,
    ]);

    return article;
  }

  async delete(id: number): Promise<Article> {
    const article = await this.prisma.article.delete({ where: { id } });

    await this.cache.invalidate([
      `article:${id}`,
      "articles:all",
      `user:${article.userId}:articles`,
    ]);

    return article;
  }

  async findByUserId(userId: number): Promise<Article[]> {
    return this.cache.getOrFetch(
      `user:${userId}:articles`,
      () =>
        this.prisma.article.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
      this.CACHE_TTL.USER_LIST
    );
  }
}
