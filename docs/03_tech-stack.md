# 03 - 技術スタック

## 一覧

| レイヤー | 技術 | バージョン目安 |
|---|---|---|
| フレームワーク | Next.js（App Router） | 14.x |
| 言語 | TypeScript | 5.x |
| スタイリング | Tailwind CSS | 3.x |
| ガントチャート | frappe-gantt | 0.6.x |
| 認証 | Supabase Auth（マジックリンク） | @supabase/supabase-js 2.x |
| DB | Supabase PostgreSQL | @supabase/supabase-js 2.x |
| ホスティング | Vercel | - |

---

## 各技術の選定理由

### Next.js（App Router）

- React 18のServer Componentsに対応した公式フレームワーク
- App Routerによるファイルベースルーティングで、ページ追加が容易
- Vercelと開発元が同一であり、デプロイ・CDN・プレビュー環境が完全に最適化されている
- TypeScriptを標準サポートし、型安全なコードを維持しやすい
- Supabase Auth等のクライアント専用処理は `'use client'` ディレクティブで明示的に分離

### Tailwind CSS

- ユーティリティファーストで素早くスタイリング可能
- デザインシステムを持たない個人プロジェクトに適している

### frappe-gantt

- **MITライセンス（商用利用無料）**
- dhtmlx-ganttは商用ライセンスが有料（Free版は機能制限あり）
- シンプルなAPIで実装コストが低い
- バンドルサイズが軽量
- ドラッグ&ドロップによる日程変更をサポート
- **トレードオフ**: 連鎖更新などの高度な機能は自前実装が必要

### Supabase Auth

- メールアドレスへのマジックリンク（OTP）送信による、パスワードレス認証を実装
- JWTトークン管理・セッション維持をSupabaseが担当するため、セキュリティリスクを最小化
- Row Level Security（RLS）と統合されており、`auth.uid()` で認証済みユーザーのIDをSQLレベルで直接参照可能
- `supabase.auth.signInWithOtp({ email })` 1行でマジックリンク送信が可能

### Supabase PostgreSQL

- PostgreSQLによるリレーショナルデータベースで、外部キー制約・トランザクションが利用可能
- Supabase Realtimeによるリアルタイム同期が容易（PostgreSQL LISTEN/NOTIFY ベース）
- 無料枠（Free tier）：データベース 500MB、月間アクティブユーザー 50,000件
- RLSポリシーにより、SQLレベルでアクセス制御が可能
- 未ログインユーザーのデータはローカルストレージに保存し、ログイン後にSupabaseへ移行
- `@supabase/supabase-js` でFirebaseに近い感覚で実装可能
- **トレードオフ**: NoSQLに比べスキーマ変更にマイグレーションが必要

### Vercel

- Next.js のデプロイに最適化されており、設定がシンプル
- GitHubと連携して自動デプロイ（push → プレビュー/本番デプロイ）
- SSL証明書が自動付与
- CDN配信で高速
- Firebase Hostingより柔軟なリダイレクト・リライト設定が可能

---

## 将来の拡張に向けた考慮

| 拡張内容 | 対応技術 |
|---|---|
| メール通知 | Supabase Edge Functions + Resend / SendGrid |
| チーム共有 | SupabaseのRLSポリシー拡張（project_membersテーブル追加） |
| PDFエクスポート | html2canvas + jsPDF |
| 祝日考慮 | 祝日APIまたは静的データ |
