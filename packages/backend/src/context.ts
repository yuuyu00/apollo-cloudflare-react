import { PrismaClient } from "@prisma/client";
import { ArticleRepository } from "./repositories/article";
import { CategoryRepository } from "./repositories/category";
import { UserRepository } from "./repositories/user";
import { ArticleService } from "./services/article";
import { CategoryService } from "./services/category";
import { UserService } from "./services/user";
import { AuthUser } from "./auth";
import { Env } from "./types";

export function createContext(
  prisma: PrismaClient,
  user: AuthUser | null,
  env: Env
) {
  const repositories = {
    article: new ArticleRepository(prisma),
    category: new CategoryRepository(prisma),
    user: new UserRepository(prisma),
  };

  const services = {
    article: new ArticleService(
      repositories.article,
      repositories.user,
      repositories.category
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
