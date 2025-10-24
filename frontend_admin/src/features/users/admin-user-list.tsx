"use client";

import { useMemo } from "react";
import { useAdminUsers } from "./use-admin-users";

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function AdminUserList() {
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminUsers();

  const users = useMemo(() => data?.users ?? [], [data]);

  if (isLoading) {
    return (
      <div className="status-card">
        <p>読み込み中…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="status-card status-card--error">
        <p>ユーザー一覧の取得に失敗しました。</p>
        <pre>{(error as Error).message}</pre>
        <button type="button" onClick={() => refetch()}>再試行</button>
      </div>
    );
  }

  return (
    <div className="panel">
      <header className="panel__header">
        <div>
          <h1>登録ユーザー一覧</h1>
          <p>イベントソーシングで登録されたユーザーとそのステータスを表示します。</p>
        </div>
        <button type="button" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "更新中…" : "再読み込み"}
        </button>
      </header>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ユーザーID</th>
              <th>氏名</th>
              <th>メール</th>
              <th>ステータス</th>
              <th>登録日時</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  登録ユーザーがまだ存在しません。
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <code>{user.id}</code>
                  </td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`status status--${user.status.toLowerCase()}`}>
                      {user.status === "VERIFIED" ? "確認済み" : "確認待ち"}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
