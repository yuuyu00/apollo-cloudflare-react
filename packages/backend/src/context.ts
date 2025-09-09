import { PrismaClient } from "@prisma/client";
import { ArticleRepository } from "./repositories/article";
import { CategoryRepository } from "./repositories/category";
import { UserRepository } from "./repositories/user";
import { ImageArticleRepository } from "./repositories/image";
import { ArticleService } from "./services/article";
import { CategoryService } from "./services/category";
import { UserService } from "./services/user";
import { AuthUser } from "./auth";

export function createContext(
  prisma: PrismaClient,
  user: AuthUser | null,
  env: Env
) {
  const repositories = {
    article: new ArticleRepository(prisma, env.CACHE_KV),
    category: new CategoryRepository(prisma, env.CACHE_KV),
    user: new UserRepository(prisma, env.CACHE_KV),
    image: new ImageArticleRepository(prisma, env.CACHE_KV),
  };

  const services = {
    article: new ArticleService(
      repositories.article,
      repositories.user,
      repositories.category,
      repositories.image
    ),
    category: new CategoryService(repositories.category),
    user: new UserService(repositories.user),
  };

  return {
    prisma,
    user,
    env,
    services,
  };
}

export type Context = ReturnType<typeof createContext>;
