'use client';

import { useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';

interface TaskEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * インデントテキスト入力エリア
 * Tab/Shift+Tab でインデントの増減を行う
 */
export function TaskEditor({ value, onChange, placeholder, disabled }: TaskEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // カーソル位置を保存して useEffect で復元する
  const cursorRef = useRef<{ start: number; end: number } | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && cursorRef.current !== null) {
      textarea.setSelectionRange(cursorRef.current.start, cursorRef.current.end);
      cursorRef.current = null;
    }
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();

    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value: val } = textarea;

    // 現在行の先頭位置を取得
    const lineStart = val.lastIndexOf('\n', selectionStart - 1) + 1;

    if (e.shiftKey) {
      // Shift+Tab: インデントを減らす（先頭の2スペースを削除）
      if (val.slice(lineStart, lineStart + 2) === '  ') {
        const newValue = val.slice(0, lineStart) + val.slice(lineStart + 2);
        cursorRef.current = {
          start: Math.max(lineStart, selectionStart - 2),
          end: Math.max(lineStart, selectionEnd - 2),
        };
        onChange(newValue);
      }
    } else {
      // Tab: インデントを増やす（先頭に2スペースを追加）
      const newValue = val.slice(0, lineStart) + '  ' + val.slice(lineStart);
      cursorRef.current = {
        start: selectionStart + 2,
        end: selectionEnd + 2,
      };
      onChange(newValue);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      rows={12}
      className="w-full font-mono text-sm border border-gray-300 rounded-md p-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
      spellCheck={false}
    />
  );
}
