# 07 - スケジュール自動計算ロジック

## 概要

インデントテキストをパースし、プロジェクト期日から逆算して各タスクの開始日・終了日を自動計算する。

---

## 1. インデントテキストのパース（`indentParser.ts`）

### 入力例

```
引越し作業
  不用品処分 [2d]
  荷物梱包
    リビング [4h]
    寝室 [2h]
  引越し当日 [8h]
```

`[4h]` → `estimatedDays: 0.5`（4時間 ÷ 8時間/日）
`[2h]` → `estimatedDays: 0.25`
`[8h]` → `estimatedDays: 1.0`（8時間 = 1日）

### パース仕様

1. 各行の先頭スペース数（2スペース単位 or タブ）から深さ（depth）を算出
2. タスク名末尾の記法を検出し工数を抽出:
   - `[Nd]` パターン（正規表現: `/\[(\d+)d\]$/`）→ `estimatedDays: N`, `isHourBased: false`
   - `[Nh]` パターン（正規表現: `/\[(\d+)h\]$/`）→ `estimatedDays: N/8`, `estimatedHours: N`, `isHourBased: true`
   - 未指定 → `estimatedDays: 1`, `isHourBased: false`
3. 記法を除去したものが `title`
4. 結果を `TaskNode` の木構造に変換
5. 木構造構築後、`children` を持つ（親）タスクに `[Nh]` が指定されていた場合は無視してデフォルト（1日）扱いに上書き

### TaskNode 型

```typescript
type TaskNode = {
  title: string;
  estimatedDays: number;        // デフォルト: 1（小数OK。[Nh]は N/8 に変換）
  estimatedHours: number | null; // [Nh]記法の場合の元の時間数
  isHourBased: boolean;         // [Nh]記法で指定されたか
  children: TaskNode[];
};
```

### パース結果（上記例）

```json
{
  "title": "引越し作業",
  "estimatedDays": 1,
  "estimatedHours": null,
  "isHourBased": false,
  "children": [
    { "title": "不用品処分", "estimatedDays": 2, "estimatedHours": null, "isHourBased": false, "children": [] },
    {
      "title": "荷物梱包", "estimatedDays": 1,
      "children": [
        { "title": "リビング", "estimatedDays": 1, "children": [] },
        { "title": "寝室",     "estimatedDays": 1, "children": [] }
      ]
    },
    { "title": "引越し当日", "estimatedDays": 1, "children": [] }
  ]
}
```

---

## 2. 営業日計算（`dateUtils.ts`）

### `addBusinessDays(date: Date, days: number): Date`

指定日から `days` 営業日後の日付を返す。土日をスキップ。`days` は小数可（例: `0.5` = 半日）。

```
例: 2026/04/24（金）から3営業日後
  → 04/24 (金) → +1 → 04/27 (月) → +1 → 04/28 (火) → +1 → 04/29 (水)
  → 結果: 2026/04/29 (水)
```

### `subtractBusinessDays(date: Date, days: number): Date`

指定日から `days` 営業日前の日付を返す（逆算に使用）。`days` は小数可。

小数日の扱い:
- 整数部分: 完全な営業日分を遡る
- 小数部分: 同日内の時間として扱う（スケジュール計算上は境界の日として処理）
- ガントチャート用に日付を返す際は `Math.ceil` で切り上げ（最低1日）

### `countBusinessDays(start: Date, end: Date): number`

2つの日付間の営業日数を返す（期日超過チェックに使用）。小数日も含めた合計を返す。

---

## 3. スケジュール逆算ロジック（`scheduleCalc.ts`）

### アルゴリズム概要

再帰的に木構造を辿り、末尾から逆算で日付を割り当てる。

**基本ルール:**
- 末端タスク（子なし）: `estimatedDays` 営業日を割り当て
- 親タスク: 子タスクの期間をすべて含むスパン
- 同一親の兄弟タスク: 上から順に直列（前タスクの翌営業日に次タスクが開始）

### 逆算の手順

```
1. プロジェクト期日 = deadline（例: 2026/04/30）
2. ルートタスクの endDate = deadline
3. ルートタスクの子タスクを逆順（末っ子 → 長子）に処理
   a. 末っ子 endDate = 親の endDate
   b. 末っ子 startDate = subtractBusinessDays(endDate, estimatedDays - 1)
   c. 次の子 endDate = subtractBusinessDays(末っ子 startDate, 1)
   d. 同様に繰り返す
4. 再帰的に子タスクにも同じ処理を適用
```

### 疑似コード

```typescript
function assignDates(node: TaskNode, endDate: Date): ScheduledTask {
  if (node.children.length === 0) {
    // 末端タスク
    const startDate = subtractBusinessDays(endDate, node.estimatedDays - 1);
    return { ...node, startDate, endDate };
  }

  // 子タスクを逆順に処理
  const scheduledChildren: ScheduledTask[] = [];
  let currentEnd = endDate;

  for (let i = node.children.length - 1; i >= 0; i--) {
    const child = assignDates(node.children[i], currentEnd);
    scheduledChildren.unshift(child);
    currentEnd = subtractBusinessDays(child.startDate, 1);
  }

  const parentStart = scheduledChildren[0].startDate;
  return { ...node, startDate: parentStart, endDate, children: scheduledChildren };
}
```

---

## 4. 期日内圧縮ロジック

### 発動条件

全末端タスクの `estimatedDays` の合計が、今日から期日までの営業日数を超えた場合。

### 圧縮方法

```typescript
const totalDays = sumLeafEstimatedDays(root);         // 全末端タスクの合計日数（小数合計OK）
const availableDays = countBusinessDays(today, deadline);
const ratio = availableDays / totalDays;               // 圧縮率（< 1.0 の場合圧縮）

// 各末端タスクの estimatedDays を圧縮率で調整
// 日単位タスク: 最低1日（1.0）を保証
// 時間単位タスク: 最低1時間（1/8 = 0.125日）を保証
const minDays = task.isHourBased ? 1 / 8 : 1;
adjustedDays = Math.max(minDays, estimatedDays * ratio);
```

### 警告表示

圧縮が発生した場合、テキストエリア下部に警告を表示:
```
⚠ タスクの合計日数（15日）が残り営業日数（10日）を超えています。
  各タスクの日数を自動圧縮しました。
```

---

## 5. ガントチャートスケール自動切替

| 期日までの日数 | 表示スケール |
|---|---|
| 0〜30日 | 日単位（Day） |
| 31〜90日 | 週単位（Week） |
| 91日〜 | 月単位（Month） |

スケールは `countBusinessDays(today, deadline)` で判定し、frappe-ganttの `view_mode` に反映:
- `'Day'` / `'Week'` / `'Month'`

---

## 6. ドラッグ&ドロップ後の連鎖更新（Phase 2）

### 方針

frappe-ganttの `on_date_change` コールバックでタスクの日程変更を検知し、以下を実行:

1. 変更されたタスクの `startDate` / `endDate` を更新
2. 同一親の後続タスクを順に「変更タスクの翌営業日から」再スケジュール
3. 親タスクのスパンも更新
4. Supabaseへバッチ書き込み

### 連鎖更新の範囲

- 変更タスクより後（`orderIndex` が大きい）の兄弟タスクのみ連鎖
- 前のタスクには影響しない

---

## 7. 入力テキストの永続化

「生成」ボタン押下時、入力テキスト原文をそのまま Supabase の `projects` テーブルの `raw_input` カラムとして保存する。これにより、ページを再読み込みした際にも入力内容を復元できる。
