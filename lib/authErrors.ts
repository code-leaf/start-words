/**
 * Supabase Authのエラーメッセージ（英語・技術的な内容）を、
 * 画面表示用の日本語メッセージへ変換します。
 *
 * なぜ必要か:
 * - Supabaseから返るエラーメッセージをそのまま表示すると、
 *   技術的な情報がユーザーに露出してしまいます。
 * - 想定される代表的なケースのみ日本語化し、それ以外は
 *   汎用的なメッセージにフォールバックすることで、内部情報の露出を防ぎます。
 */
export function translateAuthError(message: string | undefined): string {
  if (!message) {
    return '認証処理中にエラーが発生しました。時間をおいて再度お試しください。';
  }

  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'メールアドレスまたはパスワードが正しくありません。';
  }
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'このメールアドレスは既に登録されています。';
  }
  if (lower.includes('password should be at least')) {
    return 'パスワードは6文字以上で入力してください。';
  }
  if (lower.includes('unable to validate email address') || lower.includes('invalid email')) {
    return 'メールアドレスの形式が正しくありません。';
  }
  if (lower.includes('email not confirmed')) {
    return 'メールアドレスの確認が完了していません。届いたメールをご確認ください。';
  }

  return '認証処理中にエラーが発生しました。時間をおいて再度お試しください。';
}
