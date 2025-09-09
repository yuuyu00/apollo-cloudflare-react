# Apollo Cloudflare React Stack

Cloudflare Workers上で動作するApollo Server、React、Clerk Authを統合したフルスタックアプリケーション

## 概要

このプロジェクトは以下の技術を使用したアーキテクチャを実装しています。

- **バックエンド**: Cloudflare Workers上で動作するApollo GraphQL ServerとD1データベース
- **フロントエンド**: Cloudflare Workers Static Assetsとしてデプロイされた React SPA
- **画像処理**: Cloudflare Workers上で動作する画像アップロード・最適化Worker
- **認証**: Clerk Authによる認証・認可
- **インフラ**: Cloudflareのエッジネットワーク上で完全サーバーレス

## アーキテクチャ

### メインアーキテクチャ

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
    ├─── Repositories層 (データアクセス + KVキャッシュ)
    ├─── Clerk JWT検証
    └─── Prisma ORM (D1 Adapter)
    │
    ├── D1 Database ─── SQLクエリ実行
    │   ・ユーザーデータ
    │   ・記事コンテンツ  
    │   ・カテゴリ管理
    │
    └── KV Namespace (CACHE_KV) ─── キャッシュ読み書き
        ・記事データ (単体: 2時間、一覧: 1時間)
        ・カテゴリデータ (24時間)
        ・ユーザーデータ (単体: 1時間、一覧: 30分)
```

### 画像処理アーキテクチャ

```
画像アップロードフロー:

クライアント
    │
    │ 画像アップロード (multipart/form-data + JWT)
    ▼
Images Worker (Cloudflare Workers)
    │
    ├── Clerk JWT検証
    │   ・トークン検証
    │   ・ユーザー権限確認
    │
    └── R2 Bucket (IMAGES_BUCKET)
        ・原画像永続保存
        ・キーパス: images/articles/{userId}/{filename}

画像配信フロー:

/images/articles/{userId}/{filename}?type=thumb
    ↓
Images Worker
    ↓
1. Cache API確認 (Worker Cache)
    ├─ HIT → キャッシュから配信
    └─ MISS ↓
2. R2から原画像取得
    ↓
3. Images API (IMAGES_API binding)で変換
    ・プリセット変換 (content: 800px, thumb: 300x200px)
    ・WebP形式出力
    ・品質最適化
    ↓
4. レスポンス生成
    ・Cache-Control: 1年 (immutable)
    ・CDN-Cache-Control: 1年
    ・ETag付与
    ↓
5. Cache APIに保存 (ctx.waitUntil)
```

### サービス連携詳細

**Cloudflare KV (キーバリューストア)**
- バックエンドの`CACHE_KV`バインディング
- Repository層でKVCacheHelperクラスによる透過的キャッシュ
- TTL設定:
  - 記事: 単体2時間、一覧1時間、ユーザー別30分
  - カテゴリ: 24時間（更新頻度が低いため）
  - ユーザー: 単体1時間、一覧30分
- キャッシュ無効化: 作成/更新/削除時に自動

**画像処理の3層キャッシュ戦略**
1. **ブラウザキャッシュ**: Cache-Control (1年、immutable)
2. **CDNエッジキャッシュ**: CDN-Cache-Control (1年)
3. **Worker Cache API**: データセンターローカルキャッシュ

**外部サービス統合**
- **Clerk Auth**: JWT認証（RSA公開鍵検証）
- **Cloudflare Services**: R2 (S3互換), KV, D1, Images API

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

- **モノレポ管理**: Turborepo v2.5.4 + pnpm workspaces
- **パッケージマネージャー**: pnpm v8.14.0（package.jsonで固定）
- **Node.js**: v22.11.0（Voltaで管理）
- **Wrangler**: v4.34.0
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
│   │   │   ├── auth.ts        # Clerk JWT検証
│   │   │   ├── schema.ts      # GraphQLスキーマ（自動生成）
│   │   │   ├── gqlTypes.ts    # GraphQL型定義（自動生成）
│   │   │   └── types.ts       # 共通型定義
│   │   ├── schema/            # GraphQLスキーマファイル (.gql)
│   │   │   └── schema.gql     # 結合スキーマ（自動生成）
│   │   ├── prisma/            # データベーススキーマ
│   │   │   └── schema.prisma  # Prismaスキーマ
│   │   ├── migrations/        # D1マイグレーション
│   │   ├── scripts/           # ビルドスクリプト
│   │   │   └── generate-schema.js
│   │   ├── wrangler.jsonc      # Cloudflare Workers設定
│   │   ├── .dev.vars.example  # ローカル開発用環境変数サンプル
│   │   └── codegen.yml        # GraphQL Code Generator設定
│   │
│   ├── frontend/              # React SPA
│   │   ├── src/
│   │   │   ├── components/    # Reactコンポーネント
│   │   │   │   └── ui/        # Catalyst UIコンポーネント
│   │   │   ├── screens/       # ページコンポーネント
│   │   │   ├── contexts/      # React Contexts
│   │   │   └── generated-graphql/ # 自動生成された型
│   │   ├── public/            # 静的ファイル
│   │   ├── wrangler.jsonc      # Static Assets設定
│   │   ├── .env.example       # 環境変数サンプル
│   │   ├── .env.staging       # ステージング環境設定
│   │   ├── .env.production    # 本番環境設定
│   │   ├── vite.config.ts     # Vite設定
│   │   └── codegen.ts         # GraphQL Code Generator設定
│   │
│   └── images-worker/         # 画像処理Worker
│       ├── src/
│       │   └── index.ts       # Workersエントリーポイント
│       ├── wrangler.jsonc      # Workers設定
│       └── README.md          # 画像Worker説明
│
├── .github/
│   └── workflows/
│       └── deploy.yml         # CI/CDパイプライン
├── turbo.json                 # Turborepo設定
├── pnpm-workspace.yaml        # pnpmワークスペース設定
├── package.json               # ルートパッケージ設定
├── tsconfig.json              # TypeScript設定
├── CLAUDE.md                  # プロジェクトドキュメント
└── README.md                  # このファイル
```

## セットアップ

### 前提条件

- Node.js v22.11.0（Voltaで管理推奨）
- pnpm v8.14.0（package.jsonで固定）
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

   バックエンド (`packages/backend/.dev.vars` - `.dev.vars.example`をコピー):

   ```
   CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
   CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
   CLERK_PEM_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQE...\n-----END PUBLIC KEY-----"
   GRAPHQL_INTROSPECTION=true
   GRAPHQL_PLAYGROUND=true
   CORS_ORIGIN=http://localhost:5000
   ```

   注: CLERK_PEM_PUBLIC_KEYはClerkダッシュボード > API Keys > Show JWT Public Key > PEM Public Keyから取得

   バックエンド (`packages/backend/.env` - Prisma CLI用):

   ```
   DATABASE_URL="file:./dev.db"
   ```

   フロントエンド (`.env.example`をコピーして`.env`を作成):

   ```
   VITE_GRAPHQL_ENDPOINT=http://localhost:8787/graphql
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
   ```

4. **Cloudflare D1データベースの作成**

   開発環境用:
   ```bash
   cd packages/backend
   pnpm wrangler d1 create apollo-cloudflare-db --env dev
   ```

   本番環境用:
   ```bash
   pnpm wrangler d1 create apollo-cloudflare-db-prod --env prod
   ```

   作成されたIDで`wrangler.jsonc`の対応する環境の`database_id`を更新してください。

5. **データベースマイグレーションの適用**

   ```bash
   # 開発環境
   pnpm d1:migrations:apply:local  # ローカル
   pnpm d1:migrations:apply:dev    # リモート開発

   # 本番環境
   pnpm d1:migrations:apply:prod:local  # ローカル
   pnpm d1:migrations:apply:prod       # リモート本番
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
   - マイグレーション作成:
     ```bash
     cd packages/backend
     pnpm d1:migrations:create:dev <name>   # 開発環境用
     pnpm d1:migrations:create:prod <name>  # 本番環境用
     ```
   - マイグレーション適用:
     ```bash
     pnpm d1:migrations:apply:local  # ローカル開発
     pnpm d1:migrations:apply:dev    # リモート開発
     ```
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
# 全パッケージのデプロイ（プロジェクトルートから）
pnpm deploy:dev    # 開発環境
pnpm deploy:prod   # 本番環境

# 個別パッケージのデプロイ
cd packages/backend
pnpm deploy:dev    # 開発環境
pnpm deploy:prod   # 本番環境

cd packages/frontend
pnpm deploy:dev    # 開発環境（.env.stagingを使用）
pnpm deploy:prod   # 本番環境（.env.productionを使用）

cd packages/images-worker
pnpm deploy:dev    # 開発環境
pnpm deploy:prod   # 本番環境
```

### 自動デプロイ (GitHub Actions)

GitHub Actionsによる自動デプロイが設定されています。

**トリガー:**
- `develop`ブランチへのプッシュ: 開発環境へデプロイ
- `main`ブランチへのプッシュ: 本番環境へデプロイ
- 手動実行 (`workflow_dispatch`): 環境を選択してデプロイ

**必要なGitHub Secrets:**

- `CLOUDFLARE_API_TOKEN`: Cloudflare APIトークン
- `CLOUDFLARE_ACCOUNT_ID`: CloudflareアカウントID

注: Clerk関連の環境変数は各Workerに個別に設定する必要があります:

```bash
# バックエンドWorkerの秘密環境変数設定
cd packages/backend
pnpm wrangler secret put CLERK_SECRET_KEY --env dev
pnpm wrangler secret put CLERK_PEM_PUBLIC_KEY --env dev
```

## トラブルシューティング

### データベース関連

**D1マイグレーションの確認:**
```bash
cd packages/backend
# 未適用のマイグレーション確認
pnpm d1:migrations:list:local      # ローカル開発
pnpm d1:migrations:list:dev        # リモート開発
pnpm d1:migrations:list:prod:local # ローカル本番
pnpm d1:migrations:list:prod       # リモート本番

# テーブル確認
pnpm d1:execute:local --command "SELECT name FROM sqlite_master WHERE type='table';"
```

**Prisma Studioでのデータ確認:**
```bash
cd packages/backend
pnpm prisma-studio
# http://localhost:5555 でアクセス
```

### 型エラー

```bash
# 型定義ファイルのクリーンアップと再生成
rm -rf packages/backend/src/gqlTypes.ts packages/backend/src/schema.ts
rm -rf packages/frontend/src/generated-graphql
pnpm generate
```

### ビルドエラー

```bash
# キャッシュクリア
pnpm clean
pnpm install
pnpm generate
pnpm build
```

## 参考リンク

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Prisma D1 Adapter](https://www.prisma.io/docs/orm/overview/databases/cloudflare-d1)
- [Apollo Server Cloudflare Workers Integration](https://www.apollographql.com/docs/apollo-server/deployment/cloudflare-workers)
- [Clerk Authentication Documentation](https://clerk.com/docs)
- [Catalyst UI Kit](https://catalyst.tailwindui.com/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)
