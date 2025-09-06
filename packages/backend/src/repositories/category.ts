import { PrismaClient, Category, Prisma } from "@prisma/client";
import { KVCacheHelper } from "./cache-helper";

export class CategoryRepository {
  private readonly cache: KVCacheHelper;

  private readonly CACHE_TTL = {
    LIST: 86400,
    SINGLE: 86400,
  };

  constructor(
    private prisma: PrismaClient,
    kv?: KVNamespace
  ) {
    this.cache = new KVCacheHelper(kv);
  }

  async findById(id: number): Promise<Category | null> {
    return this.cache.getOrFetch(
      `category:${id}`,
      () => this.prisma.category.findUnique({ where: { id } }),
      this.CACHE_TTL.SINGLE
    );
  }

  async findMany(args?: {
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput;
    take?: number;
    skip?: number;
  }): Promise<Category[]> {
    if (!args || Object.keys(args).length === 0) {
      return this.cache.getOrFetch(
        "categories:all",
        () =>
          this.prisma.category.findMany({
            orderBy: { name: "asc" },
          }),
        this.CACHE_TTL.LIST
      );
    }
    return this.prisma.category.findMany(args);
  }

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    const category = await this.prisma.category.create({ data });

    await this.cache.invalidate(["categories:all"]);

    return category;
  }

  async update(
    id: number,
    data: Prisma.CategoryUpdateInput
  ): Promise<Category> {
    const category = await this.prisma.category.update({ where: { id }, data });

    await this.cache.invalidate([`category:${id}`, "categories:all"]);

    return category;
  }

  async delete(id: number): Promise<Category> {
    const category = await this.prisma.category.delete({ where: { id } });

    await this.cache.invalidate([`category:${id}`, "categories:all"]);

    return category;
  }
}
