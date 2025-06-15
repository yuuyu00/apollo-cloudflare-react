# GitHub Actions セットアップガイド

このドキュメントは、GitHub Actions を使用した自動デプロイの設定方法を説明します。

## 概要

`.github/workflows/deploy.yml` は以下の処理を自動化します：

1. **Backend (Apollo Server)** を Cloudflare Workers にデプロイ
2. **Frontend (React SPA)** を Cloudflare Workers Static Assets にデプロイ

デプロイは以下のブランチへのプッシュ時に実行されます：
- `develop` ブランチ → 開発環境
- `main` ブランチ → 本番環境

## 必要な GitHub Secrets

GitHub リポジトリの Settings > Secrets and variables > Actions で以下の Secrets を設定してください：

### 1. CLOUDFLARE_API_TOKEN

Cloudflare API トークンの作成方法：

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. My Profile > API Tokens へ移動
3. "Create Token" をクリック
4. "Custom token" を選択して以下の権限を設定：
   - **Account**: Cloudflare Workers Scripts:Edit
   - **Zone**: Zone:Read, Page Rules:Edit
5. トークンを作成してコピー

### 2. CLOUDFLARE_ACCOUNT_ID

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 右上のアカウント名をクリック
3. Account ID をコピー

## 環境変数の管理

### Backend の環境変数

Backend の秘密情報は Cloudflare の Secret として管理されます。GitHub Actions では自動設定されないため、手動で設定が必要です：

```bash
# ローカルで実行（初回のみ）
cd packages/backend
wrangler secret put SUPABASE_JWT_SECRET
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY

# 本番環境用
wrangler secret put SUPABASE_JWT_SECRET --env production
wrangler secret put SUPABASE_URL --env production
wrangler secret put SUPABASE_ANON_KEY --env production
```

### Frontend の環境変数

Frontend のビルド時環境変数は `.env.development` と `.env.production` で管理されます。これらのファイルは Git にコミットされているため、追加の設定は不要です。

```bash
# packages/frontend/.env.development
VITE_GRAPHQL_ENDPOINT=https://apollo-cloudflare-api.your-subdomain.workers.dev/graphql
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# packages/frontend/.env.production  
VITE_GRAPHQL_ENDPOINT=https://apollo-cloudflare-api-prod.your-subdomain.workers.dev/graphql
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## デプロイフロー

### 開発環境へのデプロイ

```bash
git push origin develop
```

- Backend: `apollo-cloudflare-api.workers.dev`
- Frontend: `apollo-cloudflare-frontend.workers.dev`

### 本番環境へのデプロイ

```bash
git push origin main
```

- Backend: `apollo-cloudflare-api-prod.workers.dev`
- Frontend: `apollo-cloudflare-frontend-prod.workers.dev`

## 重要な前提条件

### Backend のコード生成

Backend は以下のファイルが自動生成される必要があります：
- `src/gqlTypes.ts` - GraphQL型定義
- `src/schema.ts` - Workers用スキーマ（`generate-schema.js`で生成）
- `schema/schema.gql` - 結合されたスキーマ

これらは GitHub Actions で自動生成されるため、ローカルで生成してコミットする必要はありません。

**注意**: GitHub Actions では Prisma Client の生成はスキップされます。Prisma Client はローカルで生成されたものがバンドルされます。

### CI用のコード生成コマンド

- `pnpm generate:ci` - Prisma生成をスキップし、GraphQLスキーマのみ生成
- DBへの接続は不要

## トラブルシューティング

### デプロイが失敗する場合

1. **API Token の権限を確認**
   - Workers Scripts の Edit 権限があるか
   - 正しいアカウントのトークンか

2. **D1 データベースの設定**
   - `wrangler.toml` の `database_id` が正しいか
   - データベースが作成されているか

3. **ビルドエラー**
   - ローカルで `pnpm build` が成功するか確認
   - 型エラーがないか確認

4. **Backend のコード生成エラー**
   - `concat` コマンドが利用可能か
   - `schema/*.gql` ファイルが存在するか
   - Prisma Clientはローカルで生成済みか確認

### ログの確認方法

GitHub Actions のログ：
- リポジトリの Actions タブで確認

Cloudflare Workers のログ：
```bash
cd packages/backend
pnpm wrangler tail

cd packages/frontend  
pnpm wrangler tail
```

## 注意事項

- Frontend の Static Assets 配信は無料（Worker が起動しないため）
- Backend の API 呼び出しは Workers の料金体系に従う
- Secrets は一度設定すれば、変更がない限り再設定不要
- ブランチ戦略：
  - `develop` → 開発環境（日常的な開発）
  - `main` → 本番環境（リリース時のみ）