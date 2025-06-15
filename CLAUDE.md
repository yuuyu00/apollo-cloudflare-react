# Apollo Cloudflare React Stack - プロジェクト情報

このドキュメントは、プロジェクトの構成、開発手順、よく使うコマンドをまとめたものです。

## プロジェクト概要

- **技術スタック**:
  - Backend: Apollo Server on Cloudflare Workers + D1
  - Frontend: React SPA on Cloudflare Workers (Static Assets)
  - Auth: Supabase Auth
- **モノレポ管理**: pnpm + Turborepo
- **Node.jsバージョン**: v22.11.0 (LTS)
- **Wranglerバージョン**: v4.20.0（重要：v4対応済み）

## ディレクトリ構成

```
apollo-cloudflare-react/
├── packages/
│   ├── backend/          # Apollo Server (Cloudflare Workers)
│   │   ├── src/
│   │   │   ├── index.ts         # Cloudflare Workersエントリーポイント
│   │   │   ├── schema.ts        # GraphQLスキーマ（自動生成）
│   │   │   ├── db.ts           # Prisma D1設定
│   │   │   └── resolvers/      # GraphQLリゾルバー
│   │   ├── prisma/
│   │   │   └── schema.prisma    # Prismaスキーマ
│   │   ├── migrations/          # D1マイグレーション
│   │   │   └── 0001_init.sql
│   │   ├── schema/              # GraphQLスキーマ定義
│   │   │   └── *.gql
│   │   ├── scripts/             # ビルドスクリプト
│   │   │   └── generate-schema.js
│   │   ├── wrangler.toml        # Wrangler v4設定
│   │   ├── .dev.vars           # ローカル開発用環境変数
│   │   └── .env                # Prisma CLI用設定
│   └── frontend/                # React + Vite (Cloudflare Workers Static Assets)
│       ├── src/
│       ├── wrangler.toml        # Workers設定
│       ├── .env                # ローカル開発用
│       ├── .env.development     # 開発環境デプロイ用
│       └── .env.production      # 本番環境デプロイ用
├── turbo.json
├── pnpm-workspace.yaml
├── CLAUDE.md                    # プロジェクトドキュメント
└── CLOUDFLARE_MIGRATION_TODO.md # 移行計画
```

## セットアップ手順

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

**Backend (.env)**

```bash
# packages/backend/.env
DATABASE_URL="file:./dev.db"  # Prisma CLI用のダミーURL
```

**Backend (.dev.vars)**

```bash
# packages/backend/.dev.vars
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
GRAPHQL_INTROSPECTION=true
GRAPHQL_PLAYGROUND=true
CORS_ORIGIN=http://localhost:3000
```

**Frontend (.env)**

```bash
# packages/frontend/.env
VITE_GRAPHQL_ENDPOINT=http://localhost:8787/graphql
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Frontend (.env.development)**

```bash
# packages/frontend/.env.development
VITE_GRAPHQL_ENDPOINT=https://apollo-cloudflare-api.your-subdomain.workers.dev/graphql
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Frontend (.env.production)**

```bash
# packages/frontend/.env.production
VITE_GRAPHQL_ENDPOINT=https://apollo-cloudflare-api-prod.your-subdomain.workers.dev/graphql
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. D1データベースのセットアップ

```bash
# D1データベースの作成（初回のみ）
cd packages/backend
pnpm wrangler d1 create apollo-cloudflare-db

# wrangler.tomlのdatabase_idを更新（作成時に表示されたIDを使用）
# database_id = "c370ca69-c11d-4d00-9fd0-b7339850fd30"

# マイグレーションの状況確認
pnpm d1:migrations:list                     # ローカルの未適用マイグレーション
pnpm d1:migrations:list:remote              # リモート（本番）の未適用マイグレーション

# マイグレーションの適用
pnpm d1:migrations:apply                    # ローカルに適用
pnpm d1:migrations:apply:remote             # リモート（本番）に適用

# テーブルの確認
pnpm d1:execute --command "SELECT name FROM sqlite_master WHERE type='table';"  # ローカル
pnpm d1:execute:remote --command "SELECT name FROM sqlite_master WHERE type='table';"  # リモート
```

## よく使うコマンド

### 開発

```bash
# 全体の開発サーバー起動
pnpm dev

# Backend (Cloudflare Workers) のみ起動
cd packages/backend && pnpm dev

# Frontend のみ起動
cd packages/frontend && pnpm dev

# Frontend Worker のローカルテスト（ポート3001）
cd packages/frontend && pnpm dev:worker
```

### ビルド・型チェック

```bash
# ビルド
pnpm build

# 型チェック
pnpm type-check

# リント
pnpm lint

# フォーマット
pnpm format
```

### コード生成

```bash
# GraphQL型定義とPrismaクライアントの生成（ルートから）
pnpm generate

# Backend の生成処理
cd packages/backend
pnpm generate  # 以下を実行:
# 1. pnpm generate:prisma    - Prismaクライアント生成
# 2. pnpm generate:codegen   - GraphQL型定義生成
# 3. pnpm generate:schema    - schema.ts生成（Workers用）

# Frontend の生成処理
cd packages/frontend
pnpm generate  # GraphQLクライアントコード生成
```

**注意**: Frontend の codegen は Backend の `schema/schema.gql` を直接参照するため、Backend で先に `pnpm generate` を実行する必要があります。

### データベース操作

```bash
cd packages/backend

# Prismaスキーマからクライアント生成
pnpm prisma generate

# D1マイグレーション関連（package.jsonのスクリプトを使用）
pnpm d1:migrations:create <migration_name>  # 新規マイグレーション作成
pnpm d1:migrations:list                     # ローカルの未適用マイグレーション一覧
pnpm d1:migrations:list:remote              # リモート（本番）の未適用マイグレーション一覧
pnpm d1:migrations:apply                    # ローカルに適用
pnpm d1:migrations:apply:remote             # リモート（本番）に適用

# D1マイグレーションのフラグ説明：
# - フラグなし・--local（デフォルト）: ローカルDB（wrangler devで使用）に対して実行
# - --remote: リモートの本番DBに対して実行

# SQLの実行
pnpm d1:execute --file ./migrations/0001_init.sql           # ローカルでファイル実行
pnpm d1:execute --command "SELECT * FROM User;"             # ローカルでコマンド実行
pnpm d1:execute:remote --file ./migrations/0001_init.sql    # リモートでファイル実行
pnpm d1:execute:remote --command "SELECT * FROM User;"      # リモートでコマンド実行

# データベース情報の確認
pnpm wrangler d1 info apollo-cloudflare-db
```

### デプロイ

#### Backend (Apollo Server)

```bash
cd packages/backend

# ローカル開発サーバー（http://localhost:8787）
pnpm dev  # または pnpm wrangler dev

# デプロイ（開発環境）
pnpm deploy:dev  # または pnpm wrangler deploy

# デプロイ（本番環境）
pnpm deploy:prod  # または pnpm wrangler deploy --env production

# シークレット環境変数の設定
pnpm wrangler secret put SUPABASE_JWT_SECRET
pnpm wrangler secret put SUPABASE_URL
pnpm wrangler secret put SUPABASE_ANON_KEY

# ログの確認
pnpm wrangler tail

# Workers の設定確認
pnpm wrangler whoami      # ログイン状態確認
pnpm wrangler config list  # 設定一覧
```

#### Frontend (React SPA)

```bash
cd packages/frontend

# デプロイ（開発環境）
pnpm deploy:dev   # .env.developmentを使用してビルド

# デプロイ（本番環境）
pnpm deploy:prod  # .env.productionを使用してビルド

# デプロイURL
# 開発: https://apollo-cloudflare-frontend.your-subdomain.workers.dev
# 本番: https://apollo-cloudflare-frontend-prod.your-subdomain.workers.dev
```

## Wrangler v4 対応について

### 重要な変更点

1. **node_compat → nodejs_compat**

   - `node_compat = true` は廃止
   - `compatibility_flags = ["nodejs_compat"]` を使用

2. **削除された設定**

   - `[upload]` セクション
   - `[build].watch_paths`
   - `[tsconfig]` セクション（tsconfig.jsonで管理）

3. **エントリーポイント**

   - `src/index.ts` が必須（Cloudflare Workers形式）
   - Express形式の `server.ts` は使用不可
   - `export default` で fetch ハンドラーをエクスポート

4. **Apollo Server統合**
   - `@as-integrations/cloudflare-workers` を使用
   - Prisma D1 Adapter でデータベース接続

## トラブルシューティング

### pnpm generateでエラーが出る場合

1. Node.jsバージョンが22.11.0であることを確認
2. `packages/backend/.env`に`DATABASE_URL="file:./dev.db"`が設定されているか確認
3. `pnpm prisma generate`を先に実行

### D1マイグレーションが失敗する場合

```bash
# テーブルの存在確認
pnpm wrangler d1 execute apollo-cloudflare-db --command "SELECT name FROM sqlite_master WHERE type='table';"

# 既存のテーブルを削除して再実行
pnpm wrangler d1 execute apollo-cloudflare-db --command "DROP TABLE IF EXISTS User, Article, Category, _ArticleToCategory;"
```

### D1コマンドで対象環境を明確に指定する

D1コマンドはデフォルトでローカルDBに対して実行されます：

- **ローカル**: フラグなし または `--local`フラグ（デフォルト）
- **リモート（本番）**: `--remote`フラグを明示的に追加

```bash
# 例：マイグレーションの適用
pnpm d1:migrations:apply         # ローカル（デフォルト）
pnpm d1:migrations:apply:remote  # リモート本番（--remote）
```

### 型エラーが発生する場合

```bash
# 生成ファイルのクリーンアップ
rm -rf packages/backend/src/gqlTypes.ts
rm -rf packages/frontend/src/generated-graphql

# 再生成
pnpm generate
```

## 開発フロー

1. **機能開発**

   - GraphQLスキーマの更新（`packages/backend/schema/*.gql`）
   - `pnpm generate`で型定義を生成
   - リゾルバーの実装
   - フロントエンドの実装

2. **データベース変更**

   - Prismaスキーマの更新（`packages/backend/prisma/schema.prisma`）
   - マイグレーションファイルの作成（`packages/backend/migrations/`）
   - `pnpm d1:migrations:apply:remote`でリモートにマイグレーション適用
   - `pnpm d1:migrations:apply`でローカルにマイグレーション適用
   - `pnpm prisma generate`でクライアント更新

3. **デプロイ**
   - `pnpm build`でビルド確認
   - `pnpm type-check`で型チェック
   - Backend: `pnpm deploy:dev`（開発）または`pnpm deploy:prod`（本番）
   - Frontend: `pnpm deploy:dev`（開発）または`pnpm deploy:prod`（本番）

## 注意事項

- D1はSQLiteベースなので、一部のPostgreSQL/MySQL固有の機能は使用不可
- Cloudflare Workersは実行時間とメモリに制限あり（有料プランで緩和）
- 環境変数の管理：
  - Backend: `.dev.vars`（ローカル）、`wrangler secret`（本番の秘密情報）
  - Frontend: `.env`ファイル群（ビルド時に使用）
- 自動生成ファイルは直接編集しない：
  - `src/gqlTypes.ts` - GraphQL型定義
  - `src/schema.ts` - Workers用スキーマ
  - `schema/schema.gql` - 結合されたスキーマ
  - `src/generated-graphql/` - Frontend GraphQL型定義
- Wrangler v4では`node_compat`は廃止、`nodejs_compat`を使用
- ファイルシステムAPIは使用不可（Workers環境のため）
- **Frontend (Static Assets)の配信は無料**（Workerスクリプトが起動しないため）

## Workers Static Assets設定

Frontend の `wrangler.toml` の重要な設定：

```toml
# Cloudflare Workers with Static Assets configuration
name = "apollo-cloudflare-frontend"
compatibility_date = "2024-11-25"

# Static Assets（Workerスクリプトなし = 無料配信）
assets = { directory = "./dist", not_found_handling = "single-page-application" }

# 本番環境設定
[env.production]
name = "apollo-cloudflare-frontend-prod"
```

- `not_found_handling = "single-page-application"`: SPAのルーティングサポート
- Workerスクリプト（`main`）の指定なし: 静的アセットのみの無料配信

## 参考リンク

- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Prisma D1 Adapter](https://www.prisma.io/docs/orm/overview/databases/cloudflare-d1)
- [Apollo Server Cloudflare](https://www.apollographql.com/docs/apollo-server/deployment/cloudflare-workers)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
