import { PrismaClient, Article, Prisma } from "@prisma/client";

export class ArticleRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: number): Promise<Article | null> {
    return this.prisma.article.findUnique({ where: { id } });
  }

  async findMany(args?: {
    where?: Prisma.ArticleWhereInput;
    orderBy?: Prisma.ArticleOrderByWithRelationInput;
    take?: number;
    skip?: number;
  }): Promise<Article[]> {
    return this.prisma.article.findMany(args);
  }

  async create(data: Prisma.ArticleCreateInput): Promise<Article> {
    return this.prisma.article.create({ data });
  }

  async update(id: number, data: Prisma.ArticleUpdateInput): Promise<Article> {
    return this.prisma.article.update({ where: { id }, data });
  }

  async delete(id: number): Promise<Article> {
    return this.prisma.article.delete({ where: { id } });
  }

  async findByUserId(userId: number): Promise<Article[]> {
    return this.prisma.article.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}
