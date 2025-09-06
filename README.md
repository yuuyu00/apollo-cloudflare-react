# Apollo Cloudflare React Stack

Cloudflare Workers上で動作するApollo Server、React、Clerk Authを統合したフルスタックアプリケーション

## 概要

このプロジェクトは以下の技術を使用した本番環境対応のアーキテクチャを実装しています。

- **バックエンド**: Cloudflare Workers上で動作するApollo GraphQL ServerとD1データベース
- **フロントエンド**: Cloudflare Workers Static Assetsとしてデプロイされた React SPA
- **認証**: Clerk Authによる認証・認可
- **インフラ**: Cloudflareのエッジネットワーク上で完全サーバーレス

## アーキテクチャ

```
クライアントブラウザ
    │
    ├─── React SPA (Cloudflare Workers Static Assets)
    │     ・Apollo Client (GraphQL)
    │     ・Clerk Auth Client
    │     ・React Router (SPAルーティング)
    │
    │ GraphQLリクエスト (JWT付きヘッダー)
    ▼
Apollo Server (Cloudflare Workers)
    │
    ├─── GraphQLスキーマ & リゾルバー
    ├─── Services層 (ビジネスロジック)
    ├─── Repositories層 (データアクセス)
    ├─── Clerk JWT検証
    └─── Prisma ORM (D1 Adapter)
    │
    │ SQLクエリ
    ▼
Cloudflare D1 (SQLite)
    ・ユーザーデータ
    ・記事コンテンツ
    ・カテゴリ管理

外部サービス:
    Clerk Auth
    ・ユーザー登録/ログイン
    ・JWTトークン生成
    ・OAuthプロバイダーサポート
```

## 技術スタック

### バックエンド

- **ランタイム**: Cloudflare Workers (エッジコンピューティング)
- **API**: Apollo ServerによるGraphQL
- **データベース**: Cloudflare D1 (エッジで動作するSQLite)
- **ORM**: Prisma (D1 Adapter使用)
- **認証**: Clerk JWT検証 (publicMetadata活用)

### フロントエンド

- **フレームワーク**: React 18 (TypeScript)
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS
- **GraphQLクライアント**: Apollo Client
- **ルーティング**: React Router
- **デプロイ**: Cloudflare Workers Static Assets

### 開発ツール

- **モノレポ管理**: Turborepo + pnpm workspaces
- **パッケージマネージャー**: pnpm v8.14.0
- **コード生成**: GraphQL Code Generator
- **型安全性**: エンドツーエンドのTypeScript
- **CI/CD**: GitHub Actions
- **UIコンポーネント**: Catalyst (Tailwind UI Kit)

## プロジェクト構成

```
apollo-cloudflare-react/
├── packages/
│   ├── backend/                 # Cloudflare Workers上のApollo Server
│   │   ├── src/
│   │   │   ├── index.ts        # Workersエントリーポイント
│   │   │   ├── repositories/   # データアクセス層
│   │   │   ├── services/       # ビジネスロジック層
│   │   │   ├── resolvers/      # GraphQLリゾルバー
│   │   │   │   ├── queries/    # Query resolvers
│   │   │   │   ├── mutations/  # Mutation resolvers
│   │   │   │   └── trivials/   # Field resolvers
│   │   │   ├── errors/         # エラー定義
│   │   │   ├── context.ts      # GraphQLコンテキスト
│   │   │   ├── db.ts          # Prismaクライアント設定
│   │   │   └── auth.ts        # Clerk JWT検証
│   │   ├── schema/            # GraphQLスキーマファイル (.gql)
│   │   ├── prisma/            # データベーススキーマ
│   │   ├── migrations/        # D1マイグレーション
│   │   └── wrangler.jsonc      # Cloudflare Workers設定
│   │
│   └── frontend/              # React SPA
│       ├── src/
│       │   ├── components/    # Reactコンポーネント
│       │   │   └── ui/        # Catalyst UIコンポーネント
│       │   ├── screens/       # ページコンポーネント
│       │   ├── contexts/      # React Contexts
│       │   └── generated-graphql/ # 自動生成された型
│       ├── wrangler.jsonc      # Static Assets設定
│       └── .env.development   # 開発環境設定
│
├── .github/
│   └── workflows/
│       └── deploy.yml         # CI/CDパイプライン
├── turbo.json                 # Turborepo設定
├── pnpm-workspace.yaml        # pnpmワークスペース設定
└── README.md                  # このファイル
```

## セットアップ

### 前提条件

- Node.js v22.11.0 (LTS)
- pnpm v8.14.0以上
- Cloudflareアカウント
- Clerkアカウント

### 初期設定

1. **リポジトリのクローン**

   ```bash
   git clone <repository-url>
   cd apollo-cloudflare-react
   ```

2. **依存関係のインストール**

   ```bash
   pnpm install
   ```

3. **環境変数の設定**

   バックエンド (`packages/backend/.dev.vars`):

   ```
   CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
   CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
   CLERK_PEM_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQE...\n-----END PUBLIC KEY-----
   GRAPHQL_INTROSPECTION=true
   GRAPHQL_PLAYGROUND=true
   CORS_ORIGIN=http://localhost:5000
   ```

   バックエンド (`packages/backend/.env`):

   ```
   DATABASE_URL="file:./dev.db"
   ```

   フロントエンド (`packages/frontend/.env`):

   ```
   VITE_GRAPHQL_ENDPOINT=http://localhost:8787/graphql
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
   ```

4. **Cloudflare D1データベースの作成**

   ```bash
   cd packages/backend
   pnpm wrangler d1 create apollo-cloudflare-db
   ```

   作成されたIDで`wrangler.jsonc`の`database_id`を更新してください。

5. **データベースマイグレーションの適用**

   ```bash
   # ローカル環境
   pnpm d1:migrations:apply

   # リモート環境
   pnpm d1:migrations:apply:remote
   ```

6. **コード生成**
   ```bash
   # プロジェクトルートから
   pnpm generate
   ```

## 開発

### 開発サーバーの起動

```bash
# バックエンドとフロントエンドの両方を起動
pnpm dev

# バックエンドのみ (http://localhost:8787)
cd packages/backend && pnpm dev

# フロントエンドのみ (http://localhost:5000)
cd packages/frontend && pnpm dev
```

### 開発ワークフロー

1. **GraphQLスキーマの変更**

   - `packages/backend/schema/`内の`.gql`ファイルを編集
   - `pnpm generate`を実行して型を更新
   - `packages/backend/src/services/`でサービスを実装
   - `packages/backend/src/repositories/`でリポジトリを実装（必要に応じて）
   - `packages/backend/src/resolvers/`でリゾルバーを実装

2. **データベーススキーマの変更**

   - `packages/backend/prisma/schema.prisma`を更新
   - マイグレーション作成: `pnpm d1:migrations:create <name>`
   - ローカルに適用: `pnpm d1:migrations:apply`
   - Prismaクライアント生成: `pnpm prisma generate`

3. **フロントエンド開発**
   - `packages/frontend/src/generated-graphql/`に型が自動生成される
   - `pnpm generate`を実行して型付きフックを作成
   - Reactコンポーネントで生成されたフックを使用
   - Catalyst UIコンポーネントを活用したUI構築

### コード品質チェック

```bash
# 型チェック
pnpm type-check

# リンティング
pnpm lint

# コードフォーマット
pnpm format

# ビルド（全チェックを含む）
pnpm build
```

## デプロイ

### 手動デプロイ

```bash
# バックエンドのデプロイ
cd packages/backend
pnpm deploy:dev    # 開発環境
pnpm deploy:prod   # 本番環境

# フロントエンドのデプロイ
cd packages/frontend
pnpm deploy:dev    # 開発環境
pnpm deploy:prod   # 本番環境
```

### 自動デプロイ (GitHub Actions)

GitHub Actionsによる自動デプロイが設定されています。

- `develop`ブランチへのプッシュ: 開発環境へデプロイ
- `main`ブランチへのプッシュ: 本番環境へデプロイ

必要なGitHub Secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLERK_SECRET_KEY`
- `CLERK_PEM_PUBLIC_KEY`
