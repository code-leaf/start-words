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
  // data には currentCard.answers から取り出した正解候補テキストの配列（string[]）が渡される (MVP14)
  errataCorrect: {
    title: "正解！",
    message: (data) => `正解です！\n答え: ${(data as string[]).join("、")}`,
    buttons: [
      { label: "閉じる", colorVariant: "primary", actionKey: "close" },
    ],
    closeOnOverlayClick: true,
  },

  // errata学習の不正解通知用モーダル定義
  // 不正解時も正解候補一覧を必ず表示し、ユーザーが正解を確認できるようにする
  errataIncorrect: {
    title: "不正解...",
    message: (data) => `残念、不正解です。\n正解: ${(data as string[]).join("、")}`,
    buttons: [
      { label: "閉じる", colorVariant: "primary", actionKey: "close" },
    ],
    closeOnOverlayClick: true,
  },

  // 単語登録画面のカード登録成功通知用モーダル定義
  // 閉じた後に入力欄をクリアする処理は、openModal呼び出し側（useCardRegister）のonActionで行う
  registerSuccess: {
    title: "登録しました",
    message: "カードを登録しました。続けて次のカードを登録できます。",
    buttons: [
      { label: "閉じる", colorVariant: "success", actionKey: "close" },
    ],
    closeOnOverlayClick: true,
  },

  // 単語登録画面での表テキスト重複通知用モーダル定義
  // 重複時は入力値を保持したいため、呼び出し側ではonActionを渡さずクリアしない
  registerDuplicate: {
    title: "登録できません",
    message: "同じ「表」の単語がすでに登録されています。",
    buttons: [
      { label: "閉じる", colorVariant: "danger", actionKey: "close" },
    ],
    closeOnOverlayClick: true,
  },

  // 単語編集画面のカード更新成功通知用モーダル定義 (MVP14)
  editSuccess: {
    title: "更新しました",
    message: "カードの内容を更新しました。",
    buttons: [
      { label: "閉じる", colorVariant: "success", actionKey: "close" },
    ],
    closeOnOverlayClick: true,
  },

  // 単語編集画面での表テキスト重複通知用モーダル定義 (MVP14)
  // 比較対象からは編集中のカード自身を除外しているため、他の登録済みカードと重複した場合のみ表示される
  editDuplicate: {
    title: "更新できません",
    message: "同じ「表」の単語が、他のカードに既に登録されています。",
    buttons: [
      { label: "閉じる", colorVariant: "danger", actionKey: "close" },
    ],
    closeOnOverlayClick: true,
  },

  // 学習セッション完了時のscores保存失敗通知用モーダル定義 (MVP10)
  // 保存に成功したことにして結果画面へ進むことはせず、失敗を明示的に通知する。
  // 再試行は「結果を見る」ボタンを再度押すことで行えるため、専用の再試行ボタンは持たない。
  saveScoreError: {
    title: "保存に失敗しました",
    message:
      "学習結果の保存に失敗しました。\n通信状況をご確認のうえ、もう一度「結果を見る」ボタンを押してください。",
    buttons: [
      { label: "閉じる", colorVariant: "danger", actionKey: "close" },
    ],
    closeOnOverlayClick: true,
  },
};
