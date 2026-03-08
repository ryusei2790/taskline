/**
 * 指定日から指定営業日数後の日付を返す（小数対応）
 * 小数部分は無視して整数日数で計算（切り上げ）
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  const wholeDays = Math.ceil(days);
  let added = 0;
  while (added < wholeDays) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) {
      added++;
    }
  }
  return result;
}

/**
 * 指定日から指定営業日数前の日付を返す（小数対応・逆算用）
 * 小数部分は無視して整数日数で計算（切り上げ）
 */
export function subtractBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  const wholeDays = Math.ceil(days);
  let subtracted = 0;
  while (subtracted < wholeDays) {
    result.setDate(result.getDate() - 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) {
      subtracted++;
    }
  }
  return result;
}

/**
 * 2日付間の営業日数を返す（start 当日を含む、end 当日を含む）
 * 工数超過チェックおよびスケジュール圧縮率の算出に使用
 */
export function countBusinessDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * 2つの Date が同じ日付かどうかを判定（時刻は無視）
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Date を "YYYY-MM-DD" 形式の文字列に変換（frappe-gantt 用）
 */
export function formatDateYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * "YYYY-MM-DD" 形式の文字列をローカル時刻の Date に変換
 * new Date("YYYY-MM-DD") は UTC として解釈されタイムゾーンでズレるため、
 * "T00:00:00" を付与してローカル時刻として解釈させる
 */
export function parseDateLocal(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}
