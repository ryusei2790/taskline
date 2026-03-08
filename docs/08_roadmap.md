# 08 - 開発ロードマップ

## Phase 1 - MVP

**目標**: 基本的なタスク入力 → スケジュール計算 → ガントチャート表示が動作する状態

### セットアップ

- [ ] Supabase プロジェクト作成（Auth・Database 有効化）
- [ ] Supabase ダッシュボードでメール認証（マジックリンク）を有効化
- [ ] Supabase SQL エディタでテーブル作成・RLS ポリシー設定（`05_db-schema.md` 参照）
- [ ] Vercel プロジェクト作成・GitHubリポジトリ連携
- [ ] Next.js 14 プロジェクト初期化（App Router・TypeScript・Tailwind CSS）
- [ ] `@supabase/supabase-js` 導入・初期化（`lib/supabase.ts`）
- [ ] ESLint + Prettier 設定
- [ ] `.env.local` に Supabase 設定（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`）を格納し `.gitignore` に追加

### 型定義・リポジトリ基盤

- [ ] `types/index.ts` 作成（`Date`ベースの共通型、`estimatedHours`/`isHourBased`フィールド含む）
- [ ] `repositories/types.ts` 作成（`IProjectRepository` / `ITaskRepository` インターフェース）
- [ ] `repositories/localStorage/serializers.ts` 作成（Date ↔ ISO文字列変換）
- [ ] `repositories/localStorage/LocalStorageProjectRepository.ts` 作成
- [ ] `repositories/localStorage/LocalStorageTaskRepository.ts` 作成
- [ ] `repositories/supabase/SupabaseProjectRepository.ts` 作成
- [ ] `repositories/supabase/SupabaseTaskRepository.ts` 作成
- [ ] `repositories/RepositoryContext.tsx` 作成（認証状態に基づきリポジトリを切り替え）

### 認証

- [ ] マジックリンクログイン実装（Supabase Auth `signInWithOtp`）
- [ ] `useAuth` カスタムフック作成（マイグレーション実行ロジック含む）
- [ ] `AuthGuard` コンポーネント（`/settings` のみ認証必須）
- [ ] `/login` ページ作成（「ログインせずに体験する」リンク追加）
- [ ] Supabase `users` テーブルへのレコード作成（初回ログイン時。`auth.users` トリガーで自動化も可）
- [ ] `lib/migration.ts` 作成（ローカル→Supabaseマイグレーション）
- [ ] `MigrationOverlay` コンポーネント作成

### プロジェクト CRUD

- [ ] `/dashboard` ページ作成（プロジェクト一覧リスト形式）
- [ ] `/projects/new` ページ作成（フォーム）
- [ ] `useProjects` カスタムフック作成（`useRepository` 経由）
- [ ] `LocalModeBanner` コンポーネント作成（未ログイン時に表示）
- [ ] ダッシュボードに `LocalModeBanner` 組み込み

### タスク入力UI

- [ ] インデントテキストエリアコンポーネント作成
- [ ] Tab / Shift+Tab キーバインド実装
- [ ] `[Nd]` / `[Nh]` 記法のパーサー実装（`utils/indentParser.ts`）
- [ ] 「生成」ボタン実装

### スケジュール計算

- [ ] 営業日計算ユーティリティ実装（`utils/dateUtils.ts`）
  - `addBusinessDays` / `subtractBusinessDays` / `countBusinessDays`（小数日対応）
- [ ] 逆算スケジュール計算実装（`lib/scheduleCalc.ts`）（小数日対応）
- [ ] 期日内圧縮ロジック実装（時間単位タスクは最低1時間保証）
- [ ] 圧縮発生時の警告表示

### ガントチャート表示

- [ ] frappe-gantt インストール・型定義確認
- [ ] `GanttChart` コンポーネント作成
- [ ] 時間単位タスクのツールチップ表示実装（ホバー時に「所要時間: N時間」）
- [ ] スケール自動切替ロジック実装（日/週/月）
- [ ] スケール手動切替ボタンUI実装
- [ ] `/projects/:id` タブUI実装（タスクリスト / ガントチャート）

### データ永続化

- [ ] `useTasks` カスタムフック作成（`useRepository` 経由）
- [ ] `rawInput` テキスト保存（ページリロード後の復元）
- [ ] Supabase RLS ポリシー設定（`05_db-schema.md` の SQL を Supabase SQL エディタで実行）
- [ ] Supabase Realtime 有効化（テーブルごとに Realtime を Supabase ダッシュボードで ON）

### 完了条件

- 未ログインでもダッシュボード・プロジェクト作成・ガントチャート生成ができる
- ローカルストレージにデータが保存され、リロード後も保持される
- メールアドレスのマジックリンクでログインできる
- ログイン後にローカルデータがSupabaseへ自動移行される
- `[4h]` 記法でタスクを指定でき、ガントチャートで1日バーとして表示（ホバーで時間表示）
- リロードしても入力内容・タスクが保持される

---

## Phase 2 - インタラクション強化

**目標**: ガントチャートのインタラクティブな操作と、タスク管理機能の充実

- [ ] ガントチャートのバードラッグによる日程変更
- [ ] ドラッグ後の後続タスク連鎖更新ロジック実装
- [ ] タスク詳細パネル実装（ステータス・進捗率・メモの編集）
- [ ] ダッシュボードの進捗率表示（タスク完了数ベース）

### 完了条件

- ガントチャート上でバーをドラッグして日程を変更できる
- 後続タスクが連鎖して自動ずれする
- タスクのステータス・進捗率・メモを編集できる

---

## Phase 3 - 通知

**目標**: タスク開始前日のアプリ内バナー通知

- [ ] `BannerNotification` コンポーネント作成
- [ ] アプリ起動時に翌日開始タスクを検出するロジック実装
- [ ] `sessionStorage` による「閉じた通知の非表示」管理
- [ ] `/settings` ページ作成（通知のON/OFF設定）

### 完了条件

- 開始日前日にログインするとバナーが表示される
- バナーを閉じると当日セッション中は再表示されない

---

## Phase 4 - 将来拡張（未確定）

優先度を検討しながら対応する。

- [ ] 祝日考慮（祝日APIまたは静的データ）
- [ ] PDF/CSV エクスポート
- [ ] チーム共有機能（`project_members` テーブル追加 + RLSポリシー拡張）
- [ ] Supabase Edge Functions によるメール通知
- [ ] モバイル対応
