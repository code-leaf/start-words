import Link from 'next/link';

/**
 * 「ホームへ戻る」導線（全ページ共通、MVP12）
 *
 * 目的:
 * - 各ページで個別に似たデザインのリンクを作らず、単語登録画面(/register)で
 *   最初に実装したデザイン（配置・サイズ・padding・フォントサイズ・角丸・
 *   背景・枠線・アイコン・周囲の余白）を1箇所にまとめ、全ページで同一の
 *   見た目・挙動になるようにする。
 * - 共通Headerとしてではなく、各ページ自身のコンテンツの一部として、
 *   ページ内の呼び出し側で配置する（例: コンテンツ最上部）。
 * - fixed配置のAuthStatusBadge（右上）とは重ならない位置・サイズを前提に
 *   設計されている（左寄せ・通常のフロー内要素）。
 *
 * 前提: 宇宙背景（暗い背景）に直接置かれるページでの利用を想定した配色
 * （bg-white/10 + text-slate-100）のため、白背景のカードの内側など
 * 明るい背景の上では使用しないこと。
 */
export function HomeLink() {
  return (
    <div className="w-full flex justify-start">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-slate-100 text-sm font-semibold whitespace-nowrap transition-colors"
      >
        <span aria-hidden="true">←</span>
        ホームへ戻る
      </Link>
    </div>
  );
}
