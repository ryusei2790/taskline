# 04 - システム構成・アーキテクチャ

## 全体構成図

```
[ブラウザ]
    |
    | HTTPS
    v
[Vercel]  ←── Next.js App（App Router）
    |
    |-- Supabase Auth (マジックリンク認証)
    |-- Supabase PostgreSQL (ログインユーザーのデータ永続化)
    |-- localStorage  (未ログインユーザーのデータ一時保存)
```

## フロントエンド構成

### ディレクトリ構成（案）

```
app/                         # Next.js App Router
├── layout.tsx               # ルートレイアウト（Providers・フォント等）
├── page.tsx                 # / → /dashboard にリダイレクト
├── login/
│   └── page.tsx             # /login
├── dashboard/
│   └── page.tsx             # /dashboard
├── projects/
│   ├── new/
│   │   └── page.tsx         # /projects/new
│   └── [id]/
│       └── page.tsx         # /projects/[id]
└── settings/
    └── page.tsx             # /settings（認証必須）
components/                  # 汎用UIコンポーネント（'use client'）
├── common/                  # Button, Input, Modal, Header 等
│   ├── AuthGuard.tsx        # 認証必須ラッパー（/settings用）
│   ├── LocalModeBanner.tsx  # ローカルモード告知バナー
│   └── MigrationOverlay.tsx # マイグレーション中オーバーレイ
├── gantt/                   # GanttChart コンポーネント
├── task/                    # TaskEditor, TaskList コンポーネント
└── notification/            # BannerNotification コンポーネント
hooks/                       # カスタムフック（クライアント専用）
├── useAuth.ts               # 認証状態管理（マイグレーション実行含む）
├── useProjects.ts           # プロジェクトCRUD（リポジトリ経由）
└── useTasks.ts              # タスクCRUD（リポジトリ経由）
repositories/                # データリポジトリ（永続化層の抽象化）
├── types.ts                 # IProjectRepository / ITaskRepository インターフェース
├── RepositoryContext.tsx    # 認証状態に基づきリポジトリを切り替えるProvider
├── localStorage/            # ローカルストレージ実装
│   ├── LocalStorageProjectRepository.ts
│   ├── LocalStorageTaskRepository.ts
│   └── serializers.ts      # Date ↔ ISO文字列変換
└── supabase/                # Supabase実装
    ├── SupabaseProjectRepository.ts
    └── SupabaseTaskRepository.ts
lib/
├── supabase.ts              # Supabase初期化（createBrowserClient）
├── migration.ts             # ローカル→Supabaseマイグレーションロジック
└── scheduleCalc.ts          # スケジュール計算ロジック
utils/
├── indentParser.ts          # インデントテキストパーサー（[Nh]記法対応）
└── dateUtils.ts             # 営業日計算ユーティリティ（小数日対応）
types/                       # TypeScript型定義
└── index.ts
```

### ルーティング（Next.js App Router - ファイルベース）

```
app/page.tsx                → /               （/dashboard にリダイレクト）
app/login/page.tsx          → /login          （認証不要）
app/dashboard/page.tsx      → /dashboard      （認証不要）
app/projects/new/page.tsx   → /projects/new   （認証不要）
app/projects/[id]/page.tsx  → /projects/[id]  （認証不要）
app/settings/page.tsx       → /settings       （認証必須）
```

### 認証ガード

`AuthGuard` クライアントコンポーネントで `/settings` のみを保護。未認証時は `/login` にリダイレクト。

Supabase Auth はクライアントサイドで動作するため、Auth関連コンポーネント・フックはすべて `'use client'` を付与する。

未ログインユーザーはダッシュボード・プロジェクト画面を利用可能。ローカルストレージにデータが保存され、ログイン後にSupabaseへ自動マイグレーションされる。

## データフロー

### データ永続化の切り替え（リポジトリパターン）

```
[Pages / Components]
    ↓
[useProjects / useTasks hooks]  ← インターフェースのみに依存
    ↓
[RepositoryContext]             ← 認証状態を見て実装を自動切り替え
    ↓
[IProjectRepository / ITaskRepository]
      /                    \
[LocalStorage実装]    [Supabase実装]
（未ログイン時）        （ログイン時）
```

### タスク生成フロー

```
[テキストエリア入力]
    ↓
[「生成」ボタン押下]
    ↓
[indentParser: テキスト → TaskNode[] に変換（[Nd]/[Nh]記法対応）]
    ↓
[scheduleCalc: 期日逆算・土日スキップ・圧縮処理（小数日対応）]
    ↓
[リポジトリ（localStorage or Supabase）へ保存]
    ↓
[GanttChart コンポーネントへデータ渡し → 描画]
```

### ログイン時マイグレーションフロー

```
[マジックリンクでログイン成功]
    ↓
[localStorageにデータがあるか確認]
    ↓（データあり）
[MigrationOverlay表示]
    ↓
[migration.ts: localStorageデータをSupabaseへ追加]
    ↓
[localStorage をクリア]
    ↓
[ダッシュボードへ遷移]
```

### 通知フロー

```
[DashboardPage / ProjectDetailPage マウント時]
    ↓
[リポジトリからタスク一覧取得]
    ↓
[startDate が tomorrow のタスクを抽出]
    ↓
[BannerNotification コンポーネントで上部に表示]
```

## Supabase Row Level Security（RLS）ポリシー（概要）

```sql
-- RLS を有効化
ALTER TABLE users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks    ENABLE ROW LEVEL SECURITY;

-- users: 自分のレコードのみ読み書き
CREATE POLICY "users_self_only" ON users
  FOR ALL USING (auth.uid() = id);

-- projects: owner_id が自分のもののみ
CREATE POLICY "projects_owner_only" ON projects
  FOR ALL USING (auth.uid() = owner_id);

-- tasks: 親プロジェクトの owner_id が自分のもののみ
CREATE POLICY "tasks_owner_only" ON tasks
  FOR ALL USING (
    auth.uid() = (SELECT owner_id FROM projects WHERE id = tasks.project_id)
  );
```

## 状態管理方針

- グローバル状態: React Context（認証状態・リポジトリ）
- サーバー状態: Supabase Realtimeのリスナー（`supabase.channel().on('postgres_changes', ...)`）/ LocalStorageの`StorageEvent`
- ローカル状態: コンポーネントの `useState` / `useReducer`
- 状態管理ライブラリ（Redux等）は不使用（スコープが個人プロジェクト規模のため）
