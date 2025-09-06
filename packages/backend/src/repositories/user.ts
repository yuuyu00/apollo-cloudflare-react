import { PrismaClient, User, Prisma } from "@prisma/client";
import { KVCacheHelper } from "./cache-helper";

export class UserRepository {
  private readonly cache: KVCacheHelper;

  private readonly CACHE_TTL = {
    SINGLE: 3600,
    LIST: 1800,
  };

  constructor(
    private prisma: PrismaClient,
    kv?: KVNamespace
  ) {
    this.cache = new KVCacheHelper(kv);
  }

  async findById(id: number): Promise<User | null> {
    return this.cache.getOrFetch(
      `user:${id}`,
      () => this.prisma.user.findUnique({ where: { id } }),
      this.CACHE_TTL.SINGLE
    );
  }

  async findBySub(sub: string): Promise<User | null> {
    return this.cache.getOrFetch(
      `user:sub:${sub}`,
      () => this.prisma.user.findUnique({ where: { sub } }),
      this.CACHE_TTL.SINGLE
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.cache.getOrFetch(
      `user:email:${email}`,
      () => this.prisma.user.findUnique({ where: { email } }),
      this.CACHE_TTL.SINGLE
    );
  }

  async findMany(args?: {
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    take?: number;
    skip?: number;
  }): Promise<User[]> {
    if (!args || Object.keys(args).length === 0) {
      return this.cache.getOrFetch(
        "users:all",
        () =>
          this.prisma.user.findMany({
            orderBy: { createdAt: "desc" },
          }),
        this.CACHE_TTL.LIST
      );
    }
    return this.prisma.user.findMany(args);
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const user = await this.prisma.user.create({ data });

    await this.cache.invalidate(["users:all"]);

    return user;
  }

  async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    const user = await this.prisma.user.update({ where: { id }, data });

    await this.cache.invalidate([
      `user:${id}`,
      `user:sub:${user.sub}`,
      `user:email:${user.email}`,
      "users:all",
    ]);

    return user;
  }

  async delete(id: number): Promise<User> {
    const user = await this.prisma.user.delete({ where: { id } });

    await this.cache.invalidate([
      `user:${id}`,
      `user:sub:${user.sub}`,
      `user:email:${user.email}`,
      "users:all",
    ]);

    return user;
  }
}
