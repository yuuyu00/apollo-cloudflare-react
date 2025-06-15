import { ApolloServer } from '@apollo/server';
import { startServerAndCreateCloudflareWorkersHandler } from '@as-integrations/cloudflare-workers';
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { verifyJWT, AuthError } from './auth';
import type { Env, GraphQLContext } from './types';

// コンテキスト作成関数
async function createContext(request: Request, env: Env, db: D1Database): Promise<GraphQLContext> {
  // D1データベースアダプターを使用してPrismaクライアントを作成
  const adapter = new PrismaD1(db);
  const prisma = new PrismaClient({ adapter });

  // Supabase JWT認証
  let user = null;
  try {
    const authHeader = request.headers.get('Authorization');
    user = await verifyJWT(authHeader, env);
  } catch (error) {
    // 認証エラーはここではログのみ、リゾルバーで適切に処理
    if (error instanceof AuthError) {
      console.warn('Auth error:', error.message);
    }
  }

  return {
    prisma,
    user,
    env,
  };
}

// Cloudflare Workers用のエクスポート
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // CORS設定
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }

    // Apollo Serverインスタンスを作成
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      introspection: env.GRAPHQL_INTROSPECTION === 'true' || env.ENVIRONMENT !== 'production',
    });

    // Cloudflare Workers用のハンドラーを作成
    const handleGraphQL = startServerAndCreateCloudflareWorkersHandler(server, {
      context: async ({ request, env }: { request: Request; env: Env }) => 
        createContext(request, env, env.DB),
    });
    
    const response = await handleGraphQL(request, env, ctx);
    
    // CORSヘッダーを追加
    const corsHeaders = new Headers(response.headers);
    
    // Apollo Studio Sandboxのために必要なCORSヘッダー
    corsHeaders.set('Access-Control-Allow-Origin', env.CORS_ORIGIN || '*');
    corsHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    corsHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    corsHeaders.set('Access-Control-Allow-Credentials', 'true');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: corsHeaders,
    });
  },
};