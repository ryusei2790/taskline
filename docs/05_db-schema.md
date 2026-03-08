# 05 - データベーススキーマ設計（Supabase PostgreSQL）

## テーブル構成

```
PostgreSQL（Supabase）
├── users             ← auth.users（Supabase管理）を参照
├── projects          ← users.id を外部キーとして参照
└── tasks             ← projects.id を外部キーとして参照
```

---

## CREATE TABLE 定義

```sql
-- users テーブル
-- auth.users は Supabase が管理するため、プロフィール情報のみ格納する
CREATE TABLE users (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT        NOT NULL,
  display_name TEXT        NOT NULL,
  photo_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- projects テーブル
CREATE TABLE projects (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  deadline   DATE        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- tasks テーブル
-- 階層はフラット構造で管理し、parent_id と order_index で木構造を表現
CREATE TABLE tasks (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id        UUID        REFERENCES tasks(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  order_index      INTEGER     NOT NULL DEFAULT 0,
  estimated_days   NUMERIC     NOT NULL DEFAULT 1,    -- 小数OK（例: 0.5 = 4時間）
  estimated_hours  NUMERIC,                           -- [Nh]記法で指定した場合のみ
  is_hour_based    BOOLEAN     NOT NULL DEFAULT FALSE,
  start_date       DATE,
  end_date         DATE,
  status           TEXT        NOT NULL DEFAULT 'todo'
                   CHECK (status IN ('todo', 'in_progress', 'done')),
  progress         INTEGER     NOT NULL DEFAULT 0
                   CHECK (progress BETWEEN 0 AND 100),
  memo             TEXT        NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## インデックス定義

```sql
-- projects: ユーザーのプロジェクト一覧を作成日時降順で取得
CREATE INDEX idx_projects_owner_id_created_at
  ON projects (owner_id, created_at DESC);

-- tasks: プロジェクト配下のタスクを順序付きで取得
CREATE INDEX idx_tasks_project_id_order_index
  ON tasks (project_id, order_index ASC);

-- tasks: 親タスク指定での子タスク取得
CREATE INDEX idx_tasks_parent_id
  ON tasks (parent_id);
```

---

## Row Level Security（RLS）ポリシー

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

---

## データ取得パターン

### プロジェクト一覧取得

```typescript
// ログインユーザーのプロジェクト一覧（RLSにより自動フィルタリング）
const { data } = await supabase
  .from('projects')
  .select('*')
  .order('created_at', { ascending: false })
```

### タスク一覧取得（プロジェクト配下）

```typescript
// プロジェクト配下の全タスクをフラットに取得（RLSにより自動フィルタリング）
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('project_id', projectId)
  .order('order_index', { ascending: true })
```

---

## 階層構造の表現例

以下のインデントリスト:
```
引越し作業
  不用品処分 [2d]
  荷物梱包
    リビング [1d]
    寝室 [1d]
  引越し当日 [1d]
```

以下のFlat構造で保存:
```
tasks
  task1: { title: "引越し作業", parent_id: null, order_index: 0, estimated_days: 1 }
  task2: { title: "不用品処分",  parent_id: "task1", order_index: 0, estimated_days: 2 }
  task3: { title: "荷物梱包",    parent_id: "task1", order_index: 1, estimated_days: 1 }
  task4: { title: "リビング",    parent_id: "task3", order_index: 0, estimated_days: 1 }
  task5: { title: "寝室",        parent_id: "task3", order_index: 1, estimated_days: 1 }
  task6: { title: "引越し当日",  parent_id: "task1", order_index: 2, estimated_days: 1 }
```

---

## フィールド名マッピング（旧 Firestore → PostgreSQL）

| Firestore フィールド | PostgreSQL カラム | 変更理由 |
|---|---|---|
| `uid` / ドキュメントID | `id` (UUID) | auth.users.id と統一 |
| `ownerId` | `owner_id` | スネークケース統一 |
| `displayName` | `display_name` | スネークケース統一 |
| `photoURL` | `photo_url` | スネークケース統一 |
| `projectId` | `project_id` | スネークケース統一 |
| `parentId` | `parent_id` | スネークケース統一 |
| `orderIndex` | `order_index` | スネークケース統一 |
| `estimatedDays` | `estimated_days` | スネークケース統一 |
| `estimatedHours` | `estimated_hours` | スネークケース統一 |
| `isHourBased` | `is_hour_based` | スネークケース統一 |
| `startDate` | `start_date` | スネークケース統一 |
| `endDate` | `end_date` | スネークケース統一 |
| `createdAt` | `created_at` | スネークケース統一 |
| `updatedAt` | `updated_at` | スネークケース統一 |
| `Timestamp` 型 | `TIMESTAMPTZ` / `DATE` 型 | 日付はDATE、日時はTIMESTAMPTZ |

---

## LocalStorageスキーマ（未ログインユーザー用）

ログインしていないユーザーのデータはブラウザのlocalStorageに保存される。Supabase PostgreSQLスキーマと同等の構造（キャメルケース）を持ち、ログイン後にSupabaseへ自動マイグレーションされる。

### キー設計

| キー | 型 | 説明 |
|---|---|---|
| `taskline:projects` | `string`（JSON配列） | Project[] をJSON文字列化して保存 |
| `taskline:tasks` | `string`（JSON配列） | Task[] を全プロジェクト分フラットに保存 |
| `taskline:meta:version` | `string` | スキーマバージョン（現在: `"1"`） |

### シリアライズ規則

| PostgreSQL型 | LocalStorage型 | 変換 |
|---|---|---|
| `TIMESTAMPTZ` / `DATE` | ISO 8601文字列 | `new Date(str)` / `date.toISOString()` |
| UUID（`gen_random_uuid()`） | `crypto.randomUUID()` | マイグレーション時はそのままUUIDとして使用可 |
| `owner_id`（UUID） | `"__local__"` | マイグレーション時にSupabase Auth UIDに置換 |

### 保存例

```json
// localStorage["taskline:projects"]
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "ownerId": "__local__",
    "title": "引越しプロジェクト",
    "deadline": "2026-04-30T00:00:00.000Z",
    "createdAt": "2026-03-07T10:00:00.000Z",
    "updatedAt": "2026-03-07T10:00:00.000Z"
  }
]

// localStorage["taskline:tasks"]
[
  {
    "id": "e5f6g7h8-...",
    "projectId": "a1b2c3d4-...",
    "parentId": null,
    "title": "リビング",
    "orderIndex": 0,
    "estimatedDays": 0.5,
    "estimatedHours": 4,
    "isHourBased": true,
    "startDate": "2026-04-01T00:00:00.000Z",
    "endDate": "2026-04-01T00:00:00.000Z",
    "status": "todo",
    "progress": 0,
    "memo": "",
    "createdAt": "2026-03-07T10:00:00.000Z",
    "updatedAt": "2026-03-07T10:00:00.000Z"
  }
]
```
