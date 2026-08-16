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
};
