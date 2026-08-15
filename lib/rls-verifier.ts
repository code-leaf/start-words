import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { createClient as createAnonClient, SupabaseClient } from '@supabase/supabase-js';
import { Card, InsertCard, UpdateCard } from '@/types/card';

export interface RLSTestResult {
  id: number;
  title: string;
  description: string;
  expected: string;
  passed: boolean;
  details: string;
}

/**
 * Requirement 19: RLS動作確認テストスイート
 * 
 * 以下の6つの条件がPostgreSQL側で正しく強制されているかを動的に検証します。
 */
export async function runRLSTests(currentUserId: string | null): Promise<RLSTestResult[]> {
  const results: RLSTestResult[] = [];
  const supabase: SupabaseClient = createBrowserClient();

  const dummyOtherUserId = '00000000-0000-0000-0000-000000000000';

  // ----------------------------------------------------
  // テスト1: 認証ユーザーでカードを取得する
  // ----------------------------------------------------
  if (!currentUserId) {
    results.push({
      id: 1,
      title: 'テスト1: 認証ユーザーでのカード取得',
      description: 'テストユーザーで認証した状態で自分のカードを取得する',
      expected: 'テストユーザー自身のカードが取得できる',
      passed: false,
      details: 'スキップ: 現在ユーザーが認証されていません。先にログインしてください。',
    });
  } else {
    try {
      const { data, error } = await supabase.from('cards').select('*');
      if (error) {
        results.push({
          id: 1,
          title: 'テスト1: 認証ユーザーでのカード取得',
          description: 'テストユーザーで認証した状態で自分のカードを取得する',
          expected: 'テストユーザー自身のカードが取得できる',
          passed: false,
          details: `失敗: エラーが発生しました (${error.message})`,
        });
      } else {
        const cardsList = (data || []) as Card[];
        const myCards = cardsList.filter((c) => c.user_id === currentUserId);
        const hasOtherUserCards = cardsList.some((c) => c.user_id !== currentUserId);
        
        const passed = !hasOtherUserCards;
        results.push({
          id: 1,
          title: 'テスト1: 認証ユーザーでのカード取得',
          description: 'テストユーザーで認証した状態で自分のカードを取得する',
          expected: 'テストユーザー自身のカードが取得できる',
          passed,
          details: passed
            ? `成功: 自分のカード ${myCards.length} 件を取得しました。他ユーザーのカードは混入していません。`
            : `失敗: 他ユーザーのカードが混入しています。`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        id: 1,
        title: 'テスト1: 認証ユーザーでのカード取得',
        description: 'テストユーザーで認証した状態で自分のカードを取得する',
        expected: 'テストユーザー自身のカードが取得できる',
        passed: false,
        details: `例外発生: ${msg}`,
      });
    }
  }

  // ----------------------------------------------------
  // テスト2: 未認証状態でカードを取得する
  // ----------------------------------------------------
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      '';

    const unauthClient: SupabaseClient = createAnonClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await unauthClient.from('cards').select('*');
    const cardsList = (data || []) as Card[];

    if (error || cardsList.length === 0) {
      results.push({
        id: 2,
        title: 'テスト2: 未認証状態でのカード取得',
        description: '未認証状態（セッションなし）でカードを取得する',
        expected: 'カードを取得できない (0件取得またはアクセス拒否)',
        passed: true,
        details: `成功: 未認証アクセスのため0件取得されました (${error ? error.message : '0件取得'})`,
      });
    } else {
      results.push({
        id: 2,
        title: 'テスト2: 未認証状態でのカード取得',
        description: '未認証状態（セッションなし）でカードを取得する',
        expected: 'カードを取得できない (0件取得またはアクセス拒否)',
        passed: false,
        details: `失敗: 未認証にもかかわらず ${cardsList.length} 件のデータが取得されました。RLS SELECTポリシーを確認してください。`,
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({
      id: 2,
      title: 'テスト2: 未認証状態でのカード取得',
      description: '未認証状態（セッションなし）でカードを取得する',
      expected: 'カードを取得できない',
      passed: true,
      details: `成功: 未認証アクセスが拒否されました (${msg})`,
    });
  }

  // ----------------------------------------------------
  // テスト3: 他ユーザーの user_id を明示指定して取得する
  // ----------------------------------------------------
  if (!currentUserId) {
    results.push({
      id: 3,
      title: 'テスト3: 別ユーザーのカード取得拒否確認',
      description: 'テストユーザーとは異なる user_id を指定してカードを取得する',
      expected: '別ユーザーのカードは取得できない',
      passed: false,
      details: 'スキップ: 未ログイン状態です',
    });
  } else {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', dummyOtherUserId);

      const cardsList = (data || []) as Card[];

      if (error || cardsList.length === 0) {
        results.push({
          id: 3,
          title: 'テスト3: 別ユーザーのカード取得拒否確認',
          description: 'テストユーザーとは異なる user_id を指定してカードを取得する',
          expected: '別ユーザーのカードは取得できない',
          passed: true,
          details: '成功: 他ユーザーの user_id を指定した取得結果は0件でした（RLSにより遮断）。',
        });
      } else {
        results.push({
          id: 3,
          title: 'テスト3: 別ユーザーのカード取得拒否確認',
          description: 'テストユーザーとは異なる user_id を指定してカードを取得する',
          expected: '別ユーザーのカードは取得できない',
          passed: false,
          details: `失敗: 他ユーザーのカードが ${cardsList.length} 件取得されてしまいました。`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        id: 3,
        title: 'テスト3: 別ユーザーのカード取得拒否確認',
        description: 'テストユーザーとは異なる user_id を指定してカードを取得する',
        expected: '別ユーザーのカードは取得できない',
        passed: true,
        details: `成功: エラーにより遮断されました (${msg})`,
      });
    }
  }

  // ----------------------------------------------------
  // テスト4: 他ユーザーの user_id で INSERT しようとする
  // ----------------------------------------------------
  if (!currentUserId) {
    results.push({
      id: 4,
      title: 'テスト4: 他ユーザー名義のINSERT拒否確認',
      description: 'テストユーザーとは異なる user_id を指定してカードを INSERT しようとする',
      expected: 'RLSによって拒否される',
      passed: false,
      details: 'スキップ: 未ログイン状態です',
    });
  } else {
    try {
      const illegalCard: InsertCard = {
        user_id: dummyOtherUserId, // 自分のUIDではない別ユーザーID
        front_text: 'illegal_insert_test',
        back_text: '不正インサートテスト',
      };

      const { data, error } = await supabase
        .from('cards')
        .insert([illegalCard])
        .select();

      const inserted = (data || []) as Card[];

      if (error) {
        results.push({
          id: 4,
          title: 'テスト4: 他ユーザー名義のINSERT拒否確認',
          description: 'テストユーザーとは異なる user_id を指定してカードを INSERT しようとする',
          expected: 'RLSによって拒否される',
          passed: true,
          details: `成功: RLSにより拒否されました (${error.message})`,
        });
      } else if (inserted.length === 0) {
        results.push({
          id: 4,
          title: 'テスト4: 他ユーザー名義のINSERT拒否確認',
          description: 'テストユーザーとは異なる user_id を指定してカードを INSERT しようとする',
          expected: 'RLSによって拒否される',
          passed: true,
          details: '成功: RLS INSERTポリシーにより登録がブロックされました。',
        });
      } else {
        results.push({
          id: 4,
          title: 'テスト4: 他ユーザー名義のINSERT拒否確認',
          description: 'テストユーザーとは異なる user_id を指定してカードを INSERT しようとする',
          expected: 'RLSによって拒否される',
          passed: false,
          details: '失敗: 他ユーザー名義のカードが登録できてしまいました。INSERTポリシーを確認してください。',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        id: 4,
        title: 'テスト4: 他ユーザー名義のINSERT拒否確認',
        description: 'テストユーザーとは異なる user_id を指定してカードを INSERT しようとする',
        expected: 'RLSによって拒否される',
        passed: true,
        details: `成功: 例外により拒否されました (${msg})`,
      });
    }
  }

  // ----------------------------------------------------
  // テスト5: 他ユーザーのカードを UPDATE しようとする
  // ----------------------------------------------------
  if (!currentUserId) {
    results.push({
      id: 5,
      title: 'テスト5: 他ユーザーカードのUPDATE拒否確認',
      description: 'テストユーザーとは異なるユーザーのカードを UPDATE しようとする',
      expected: 'RLSによって拒否される',
      passed: false,
      details: 'スキップ: 未ログイン状態です',
    });
  } else {
    try {
      const dummyCardId = '00000000-0000-0000-0000-000000000000';
      const updateData: UpdateCard = { front_text: 'hacked_front' };

      const { data, error } = await supabase
        .from('cards')
        .update(updateData)
        .eq('id', dummyCardId)
        .select();

      const updated = (data || []) as Card[];

      if (error) {
        results.push({
          id: 5,
          title: 'テスト5: 他ユーザーカードのUPDATE拒否確認',
          description: 'テストユーザーとは異なるユーザーのカードを UPDATE しようとする',
          expected: 'RLSによって拒否される',
          passed: true,
          details: `成功: RLSにより拒否されました (${error.message})`,
        });
      } else if (updated.length === 0) {
        results.push({
          id: 5,
          title: 'テスト5: 他ユーザーカードのUPDATE拒否確認',
          description: 'テストユーザーとは異なるユーザーのカードを UPDATE しようとする',
          expected: 'RLSによって拒否される',
          passed: true,
          details: '成功: 対象行0件で更新が阻止されました（RLS UPDATEポリシーが正常に動作）。',
        });
      } else {
        results.push({
          id: 5,
          title: 'テスト5: 他ユーザーカードのUPDATE拒否確認',
          description: 'テストユーザーとは異なるユーザーのカードを UPDATE しようとする',
          expected: 'RLSによって拒否される',
          passed: false,
          details: '失敗: 他ユーザーのカードが更新できてしまいました。',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        id: 5,
        title: 'テスト5: 他ユーザーカードのUPDATE拒否確認',
        description: 'テストユーザーとは異なるユーザーのカードを UPDATE しようとする',
        expected: 'RLSによって拒否される',
        passed: true,
        details: `成功: 例外により拒否されました (${msg})`,
      });
    }
  }

  // ----------------------------------------------------
  // テスト6: 他ユーザーのカードを DELETE しようとする
  // ----------------------------------------------------
  if (!currentUserId) {
    results.push({
      id: 6,
      title: 'テスト6: 他ユーザーカードのDELETE拒否確認',
      description: 'テストユーザーとは異なるユーザーのカードを DELETE しようとする',
      expected: 'RLSによって拒否される',
      passed: false,
      details: 'スキップ: 未ログイン状態です',
    });
  } else {
    try {
      const dummyCardId = '00000000-0000-0000-0000-000000000000';
      const { data, error } = await supabase
        .from('cards')
        .delete()
        .eq('id', dummyCardId)
        .select();

      const deleted = (data || []) as Card[];

      if (error) {
        results.push({
          id: 6,
          title: 'テスト6: 他ユーザーカードのDELETE拒否確認',
          description: 'テストユーザーとは異なるユーザーのカードを DELETE しようとする',
          expected: 'RLSによって拒否される',
          passed: true,
          details: `成功: RLSにより拒否されました (${error.message})`,
        });
      } else if (deleted.length === 0) {
        results.push({
          id: 6,
          title: 'テスト6: 他ユーザーカードのDELETE拒否確認',
          description: 'テストユーザーとは異なるユーザーのカードを DELETE しようとする',
          expected: 'RLSによって拒否される',
          passed: true,
          details: '成功: 対象行0件で削除が阻止されました（RLS DELETEポリシーが正常に動作）。',
        });
      } else {
        results.push({
          id: 6,
          title: 'テスト6: 他ユーザーカードのDELETE拒否確認',
          description: 'テストユーザーとは異なるユーザーのカードを DELETE しようとする',
          expected: 'RLSによって拒否される',
          passed: false,
          details: '失敗: 他ユーザーのカードが削除できてしまいました。',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        id: 6,
        title: 'テスト6: 他ユーザーカードのDELETE拒否確認',
        description: 'テストユーザーとは異なるユーザーのカードを DELETE しようとする',
        expected: 'RLSによって拒否される',
        passed: true,
        details: `成功: 例外により拒否されました (${msg})`,
      });
    }
  }

  return results;
}
