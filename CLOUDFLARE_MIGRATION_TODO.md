# Cloudflare-GraphQL-React-Stack 移行計画

このドキュメントは、現在の Node.js/Express 構成から Cloudflare エコシステムへの移行に必要なタスクを詳細に記載しています。

## 移行概要

現在の構成:

- Backend: Apollo Server (Node.js)
- Frontend: React + Vite
- Database: SQLite (ローカル)
- Hosting: 未設定

移行後の構成:

- Backend: Apollo Server (Cloudflare Workers)
- Frontend: React + Vite (Cloudflare Pages)
- Database: Cloudflare D1
- Auth: Supabase Auth

## 前提条件

- [x] Cloudflare アカウントの作成
- [x] Supabase アカウントの作成
- [x] Wrangler CLI のインストール (`npm install -g wrangler`)
- [x] Cloudflare アカウントでのログイン (`wrangler login`)

## Phase 1: プロジェクト構造の再編成

### 1.1 ディレクトリ構造の変更

- ここを変更する必要はない。

### 1.2 package.json の更新

- [ ] ルートの `package.json` のスクリプトを更新
- [ ] ワークスペース設定を新しいディレクトリ構造に合わせて更新
- [ ] Turbo.json の設定を更新

## Phase 2: Backend (Cloudflare Workers) への移行

### 2.1 Wrangler 設定

- [ ] `apps/api/wrangler.toml` を作成
- [ ] Workers の設定（name, main, compatibility_date）
- [ ] 環境変数の設定（SUPABASE_JWT_SECRET 等）

### 2.2 D1 データベースのセットアップ

- [ ] D1 データベースの作成 (`wrangler d1 create my-d1-database`)
- [ ] `wrangler.toml` に D1 バインディングを追加
- [ ] Prisma D1 Adapter のインストール (`@prisma/adapter-d1`)
- [ ] `packages/database` に移行した Prisma スキーマの更新

### 2.3 Apollo Server の Workers 対応

- [ ] `@as-integrations/cloudflare-workers` のインストール
- [ ] `src/server.ts` を Workers 形式に書き換え
- [ ] Express 依存の削除
- [ ] Fetch API ベースのハンドラーに変更
- [ ] コンテキスト生成ロジックの更新

### 2.4 認証システムの実装

- [ ] Supabase JWT 検証の実装
- [ ] GraphQL コンテキストでのユーザー情報の設定
- [ ] 認証が必要なリゾルバーへのガード実装

### 2.5 データベースマイグレーション

- [ ] 既存の SQLite データをエクスポート
- [ ] D1 用のマイグレーションファイルに変換
- [ ] D1 へのマイグレーション実行
- [ ] シードデータの投入

## Phase 3: Frontend (Cloudflare Pages) への移行

### 3.1 Cloudflare Pages 設定

- [ ] `apps/web/wrangler.toml` を作成（Pages プロジェクト用）
- [ ] ビルド設定の追加
- [ ] 環境変数の設定

### 3.2 Supabase Auth 統合

- [ ] `@supabase/supabase-js` のインストール
- [ ] `@supabase/auth-ui-react` のインストール
- [ ] Supabase クライアントの初期化
- [ ] ログイン/サインアップ画面の実装
- [ ] 認証状態管理の実装

### 3.3 Apollo Client 設定の更新

- [ ] GraphQL エンドポイント URL の環境変数化
- [ ] Authorization ヘッダーの自動付与設定
- [ ] エラーハンドリングの更新（401/403 対応）

### 3.4 ルーティングと認証ガード

- [ ] 保護されたルートの実装
- [ ] 認証リダイレクトの設定
- [ ] ログアウト機能の実装

## Phase 4: 共通パッケージの整備

### 4.1 GraphQL スキーマ共有

- [ ] `packages/graphql` にスキーマファイルを移動
- [ ] スキーマのビルドスクリプト設定
- [ ] 型定義の自動生成設定

### 4.2 共有 UI コンポーネント

- [ ] `packages/ui` の基本設定
- [ ] 共通コンポーネントの抽出
- [ ] Storybook の設定（オプション）

## Phase 5: 開発環境の整備

### 5.1 ローカル開発環境

- [ ] Wrangler dev サーバーの設定
- [ ] ローカル D1 データベースの設定
- [ ] 環境変数の管理（.env.local 等）

### 5.2 開発スクリプトの更新

- [ ] `npm run dev` で全サービス起動
- [ ] ホットリロードの設定
- [ ] TypeScript 監視モードの設定

## Phase 6: CI/CD とデプロイ

### 6.1 GitHub Actions 設定

- [ ] ビルドワークフローの作成
- [ ] テストの自動実行
- [ ] 型チェックとリンター

### 6.2 デプロイ設定

- [ ] Cloudflare API トークンの設定
- [ ] Workers 自動デプロイ
- [ ] Pages 自動デプロイ
- [ ] D1 マイグレーションの自動化

## Phase 7: テストとドキュメント

### 7.1 テスト環境

- [ ] Workers 用のテスト設定
- [ ] D1 モックの設定
- [ ] E2E テストの更新

### 7.2 ドキュメント更新

- [ ] README.md の更新
- [ ] 環境構築手順の文書化
- [ ] API ドキュメントの更新
- [ ] トラブルシューティングガイド

## Phase 8: 最終確認と最適化

### 8.1 パフォーマンス最適化

- [ ] バンドルサイズの確認
- [ ] Workers の実行時間測定
- [ ] キャッシュ戦略の実装

### 8.2 セキュリティ確認

- [ ] 環境変数の適切な管理
- [ ] CORS 設定の確認
- [ ] Rate Limiting の実装

### 8.3 監視とログ

- [ ] Cloudflare Analytics の設定
- [ ] エラートラッキング（Sentry 等）
- [ ] ログ収集の設定

## 完了基準

- [ ] 全機能が新環境で動作すること
- [ ] 認証フローが正常に機能すること
- [ ] データの永続化が正しく行われること
- [ ] 本番環境へのデプロイが成功すること
- [ ] ドキュメントが最新化されていること

## 注意事項

1. **データ移行**: 本番データがある場合は、慎重にバックアップを取ってから作業を行う
2. **ダウンタイム**: 移行中のダウンタイムを最小限にするため、並行稼働期間を設ける
3. **ロールバック**: 各フェーズごとにロールバック手順を準備する
4. **テスト**: 各フェーズ完了後に十分なテストを実施する

## 参考リンク

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Prisma D1 Adapter](https://www.prisma.io/docs/orm/overview/databases/cloudflare-d1)
- [Apollo Server Cloudflare Integration](https://www.apollographql.com/docs/apollo-server/deployment/cloudflare-workers)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)

---

作成日: 2025-06-14
