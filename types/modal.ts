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
 * - 現時点では単語学習の自己採点用 'score' のみを定義
 * - 将来的にカード登録完了 'registerSuccess' や確認ダイアログなどをユニオン型へ追加可能
 */
export type ModalType = "score";
