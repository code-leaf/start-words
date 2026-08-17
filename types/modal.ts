/**
 * モーダル内ボタンの配色バリアント
 */
export type ModalButtonColorVariant =
  | "success"
  | "danger"
  | "primary"
  | "neutral";

/**
 * モーダル内ボタンの設定型定義
 */
export type ModalButtonConfig = {
  // ボタンに表示するテキスト
  label: string;
  // ボタンの配色バリアント（success:緑, danger:赤, primary:青, neutral:グレー）
  colorVariant: ModalButtonColorVariant;
  // アクション押下時にコールバックへ渡されるキー識別子
  actionKey: string;
};

/**
 * モーダル表示内容の設定型定義
 */
export type ModalContentConfig = {
  // モーダルのヘッダータイトル
  title: string;
  // 本文メッセージ（固定文字列または引数dataを受け取るフォーマット関数）
  message: string | ((data: unknown) => string);
  // 表示するアクションボタン配列
  buttons: ModalButtonConfig[];
  // 半透明オーバーレイをクリックした際にモーダルを閉じるかどうかのフラグ
  closeOnOverlayClick: boolean;
};

/**
 * モーダルの種別（識別子）
 *
 * 拡張方針:
 * - 種別を追加した場合、modalContents.ts 側も同時に同じキーを追加する必要がある
 *   （Record<ModalType, ModalContentConfig> により型レベルで網羅性を強制）
 * - 'score'    : word学習の自己採点（ユーザーが正誤を自己申告するモーダル）
 * - 'errataCorrect'   : errata学習の正解通知（自動判定結果が正解だった場合）
 * - 'errataIncorrect' : errata学習の不正解通知（自動判定結果が不正解だった場合）
 * - 'registerSuccess'   : 単語登録画面のカード登録成功通知
 * - 'registerDuplicate' : 単語登録画面での表テキスト重複通知（ユーザー自身の登録済みカードと重複した場合）
 */
export type ModalType =
  | "score"
  | "errataCorrect"
  | "errataIncorrect"
  | "registerSuccess"
  | "registerDuplicate";
