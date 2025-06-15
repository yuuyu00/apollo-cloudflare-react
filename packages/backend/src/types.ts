import type { PrismaClient } from '@prisma/client';
import type { AuthUser } from './auth';

// Cloudflare Workers の環境変数
export interface Env {
  DB: D1Database;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_JWT_SECRET: string;
  GRAPHQL_INTROSPECTION?: string;
  GRAPHQL_PLAYGROUND?: string;
  CORS_ORIGIN?: string;
  [key: string]: unknown;
}

// GraphQL リゾルバーのコンテキスト
export interface GraphQLContext {
  prisma: PrismaClient;
  user: AuthUser | null;
  env: Env;
}