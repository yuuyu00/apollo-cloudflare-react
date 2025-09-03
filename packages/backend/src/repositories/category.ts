import { PrismaClient, Category, Prisma } from "@prisma/client";

export class CategoryRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: number): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async findMany(args?: {
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput;
    take?: number;
    skip?: number;
  }): Promise<Category[]> {
    return this.prisma.category.findMany(args);
  }

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  async update(id: number, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return this.prisma.category.update({ where: { id }, data });
  }

  async delete(id: number): Promise<Category> {
    return this.prisma.category.delete({ where: { id } });
  }
}