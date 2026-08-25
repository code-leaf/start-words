'use client';

import React from 'react';
import { useModal } from '@/contexts/ModalContext';
import { ModalButtonColorVariant } from '@/types/modal';

// ボタンのcolorVariantに対応するスタイルクラスのマッピング
const buttonColorStyles: Record<ModalButtonColorVariant, string> = {
  success:
    'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20',
  danger:
    'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20',
  primary:
    'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-md shadow-blue-600/20',
  neutral: 'bg-[#d1d5db] hover:bg-[#9ca3af] text-slate-800',
};

/**
 * 汎用モーダルプレゼンテーションコンポーネント (PHP版 modal.php の移植)
 *
 * 目的:
 * - ModalContextの状態に応じて、設定されたタイトル・メッセージ・ボタンをレンダリング
 * - app/layout.tsx に単一配置し、アプリ内どこからでも openModal で呼び出し可能にする
 *
 * 開閉アニメーションについて:
 * - 「直前の内容を保持する」責務はModalContext側に寄せてあるため、本コンポーネントは
 *   isOpen（表示/非表示）とactiveModal（内容）をそのまま描画するだけでよい。
 *   ローカルstate・ref・useEffectを持たないことで、React 19のフック関連ルール
 *   （render中のref操作禁止・effect内setStateの多用禁止）に自然に準拠する。
 */
export function Modal() {
  const { isOpen, activeModal, closeModal } = useModal();

  // 一度も開かれたことがない場合はDOM自体を生成しない
  if (!activeModal) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && activeModal.closeOnOverlayClick) {
      closeModal();
    }
  };

  const handleButtonClick = (actionKey: string) => {
    if (activeModal.onAction) {
      activeModal.onAction(actionKey);
    }
    closeModal();
  };

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 transition-opacity duration-200 ease-out ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleOverlayClick}
      aria-hidden={!isOpen}
      aria-modal={isOpen}
      role='dialog'
    >
      {/* モーダルボックス（白背景・角丸16px・余白・影・開閉フェード＆スケール） */}
      <div
        className={`bg-white rounded-[16px] w-[90%] max-w-[420px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] text-center flex flex-col items-center transition-all duration-200 ease-out ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{ padding: '40px 32px' }}
      >
        <h2 className='text-[1.4rem] font-bold text-slate-800 tracking-tight leading-snug'>
          {activeModal.title}
        </h2>

        <p className='text-[1rem] leading-[1.8] text-[#333] mt-3 mb-6 whitespace-pre-line'>
          {activeModal.message}
        </p>

        {/* ボタン幅について（MVP15）:
            従来は固定w-[120px]だったが、MVP15のBGM選択モーダル（3ボタン、
            「🔊 音声ありで再生」等の長いラベル）で文字が折り返してしまうため、
            min-w-[100px] + px-4 のコンテンツ追従幅へ変更した。既存の短いラベル
            （「正解」「不正解」「閉じる」等）は最小幅に収まるため見た目は変わらない。
            3ボタンが1行に収まらない画面幅ではflex-wrapにより自然に折り返す。 */}
        <div className='flex items-center justify-center gap-[12px] flex-wrap'>
          {activeModal.buttons.map((button) => (
            <button
              key={button.actionKey}
              type='button'
              onClick={() => handleButtonClick(button.actionKey)}
              className={`min-w-[100px] h-[44px] px-4 rounded-[10px] font-bold text-sm sm:text-base whitespace-nowrap transition-all duration-150 active:scale-95 cursor-pointer flex items-center justify-center ${
                buttonColorStyles[button.colorVariant]
              }`}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}