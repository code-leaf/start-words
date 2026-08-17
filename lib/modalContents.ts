import { ModalContentConfig, ModalType } from "@/types/modal";

/**
 * モーダル種別ごとの表示内容定義辞書 (PHP版 modalContents の移植)
 *
 * 目的:
 * - アプリケーション全体で利用するモーダルのテキスト・ボタン・閉じる挙動を一元管理
 */
export const modalContents: Record<ModalType, ModalContentConfig> = {
  // 単語学習の自己採点用モーダル定義
  score: {
    title: "答え合わせ",
    message: "この問題は正解でしたか？",
    buttons: [
      {
        label: "不正解",
        colorVariant: "danger",
        actionKey: "incorrect",
      },
      {
        label: "正解",
        colorVariant: "success",
        actionKey: "correct",
      },
    ],
    closeOnOverlayClick: false,
  },

  // errata学習の正解通知用モーダル定義
  // data には currentCard.back_text（正解文字列）が渡される
  errataCorrect: {
    title: "正解！",
    message: (data) => `正解です！\n答え: ${data as string}`,
    buttons: [
      { label: "閉じる", colorVariant: "primary", actionKey: "close" },
    ],
    closeOnOverlayClick: true,
  },

  // errata学習の不正解通知用モーダル定義
  // 不正解時も正解文字列を必ず表示し、ユーザーが正解を確認できるようにする
  errataIncorrect: {
    title: "不正解...",
    message: (data) => `残念、不正解です。\n正解: ${data as string}`,
    buttons: [
      { label: "閉じる", colorVariant: "primary", actionKey: "close" },
    ],
    closeOnOverlayClick: true,
  },
};
