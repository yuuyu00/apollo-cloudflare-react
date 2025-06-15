import { PrismaClient } from "@prisma/client";

export interface Context {
  prisma: PrismaClient;
  user?: any; // Supabase認証後のユーザー情報
}
