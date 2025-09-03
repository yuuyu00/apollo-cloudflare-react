import { PrismaClient } from "@prisma/client";
import type { AuthUser } from "../auth";

export interface Context {
  prisma: PrismaClient;
  user?: AuthUser;
}
