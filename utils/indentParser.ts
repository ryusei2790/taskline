import type { TaskNode } from '@/types';

/** インデント1レベルのスペース数 */
const INDENT_SIZE = 2;

/** [Nd] 記法にマッチする正規表現（末尾） */
const DAY_PATTERN = /\[(\d+(?:\.\d+)?)d\]\s*$/;

/** [Nh] 記法にマッチする正規表現（末尾） */
const HOUR_PATTERN = /\[(\d+)h\]\s*$/;

/**
 * 行の先頭スペース数からインデント深さを計算する
 * タブは INDENT_SIZE スペースとして扱う
 */
function getDepth(line: string): number {
  let spaces = 0;
  for (const ch of line) {
    if (ch === ' ') spaces++;
    else if (ch === '\t') spaces += INDENT_SIZE;
    else break;
  }
  return Math.floor(spaces / INDENT_SIZE);
}

/**
 * タイトル文字列から工数記法を解析し、パース結果を返す
 */
function parseEffort(raw: string): {
  title: string;
  estimatedDays: number;
  estimatedHours: number | null;
  isHourBased: boolean;
} {
  const hourMatch = raw.match(HOUR_PATTERN);
  if (hourMatch) {
    const hours = parseInt(hourMatch[1], 10);
    return {
      title: raw.replace(HOUR_PATTERN, '').trim(),
      estimatedDays: hours / 8,
      estimatedHours: hours,
      isHourBased: true,
    };
  }

  const dayMatch = raw.match(DAY_PATTERN);
  if (dayMatch) {
    return {
      title: raw.replace(DAY_PATTERN, '').trim(),
      estimatedDays: parseFloat(dayMatch[1]),
      estimatedHours: null,
      isHourBased: false,
    };
  }

  return {
    title: raw.trim(),
    estimatedDays: 1,
    estimatedHours: null,
    isHourBased: false,
  };
}

/**
 * 後処理: 子を持つのに isHourBased === true のノードを修正する
 * 親タスクに [Nh] が指定された場合、実体は子タスクの集合なので
 * estimatedDays = 1 に上書きして整合性を保つ
 */
function fixParentHourBased(nodes: TaskNode[]): void {
  for (const node of nodes) {
    if (node.children.length > 0) {
      if (node.isHourBased) {
        node.estimatedDays = 1;
        node.estimatedHours = null;
        node.isHourBased = false;
      }
      fixParentHourBased(node.children);
    }
  }
}

/**
 * インデントテキストをパースして TaskNode の木構造配列を返す
 *
 * 対応記法:
 * - `[Nd]` → estimatedDays = N（小数可）
 * - `[Nh]` → estimatedDays = N/8, estimatedHours = N, isHourBased = true
 * - 省略時 → estimatedDays = 1
 */
export function parseIndentText(text: string): TaskNode[] {
  const lines = text
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  const roots: TaskNode[] = [];
  /** depth → 最後に処理したノード のスタック */
  const stack: Array<{ depth: number; node: TaskNode }> = [];

  for (const line of lines) {
    const depth = getDepth(line);
    const rawTitle = line.trimStart();
    const { title, estimatedDays, estimatedHours, isHourBased } = parseEffort(rawTitle);

    const node: TaskNode = {
      title,
      estimatedDays,
      estimatedHours,
      isHourBased,
      children: [],
    };

    // スタックから現在の depth より深い要素を取り除く
    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ depth, node });
  }

  fixParentHourBased(roots);
  return roots;
}
