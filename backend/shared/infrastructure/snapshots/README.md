# Snapshot Repository Implementations

スナップショットリポジトリの実装と使用方法

## 概要

Pure Event Sourcingでは、全イベントをリプレイして集約を再構築します。イベント数が増えるとパフォーマンスが低下するため、スナップショットで最適化します。

**スナップショットの仕組み:**
- 100イベントごとに集約の状態を保存（業界標準）
- 読み込み時: スナップショット + それ以降のイベントをリプレイ
- 例: 10,000イベント → スナップショット(9,900) + イベント(100個)

## 実装

### 1. InMemorySnapshotRepository (テスト用)

メモリ上にスナップショットを保存。テスト・開発用。

```typescript
import { InMemorySnapshotRepository } from '@shared/infrastructure/snapshots';
import { AccountSnapshot } from '@account/domain/snapshots/account-snapshot';

// テストで使用
const snapshotRepo = new InMemorySnapshotRepository<AccountSnapshot>();
const writeRepo = new AccountWriteRepository(
  eventStore,
  projectionRegistry,
  snapshotRepo
);

// クリーンアップ
afterEach(() => {
  snapshotRepo.clear();
});
```

### 2. EventStoreSnapshotRepository (本番用)

EventStoreDBにスナップショットを保存。推奨実装。

```typescript
import { EventStoreDBClient } from '@eventstore/db-client';
import { EventStoreSnapshotRepository } from '@shared/infrastructure/snapshots';
import { AccountSnapshot } from '@account/domain/snapshots/account-snapshot';

// 本番環境で使用
const client = EventStoreDBClient.connectionString(
  process.env.EVENTSTORE_CONNECTION_STRING || 'esdb://localhost:2113?tls=false'
);

const snapshotRepo = new EventStoreSnapshotRepository<AccountSnapshot>(
  client,
  'account' // 集約タイプ
);

const writeRepo = new AccountWriteRepository(
  eventStore,
  projectionRegistry,
  snapshotRepo
);

// アプリケーション終了時
process.on('SIGTERM', async () => {
  await snapshotRepo.close();
});
```

## ストリーム構造

EventStoreDBでは、イベントとスナップショットを別ストリームに保存：

```
イベントストリーム:
  account-123 → [Event1, Event2, Event3, ...]

スナップショットストリーム:
  snapshot-account-123 → [Snapshot(latest)]
```

### スナップショット保存戦略

- **最新のみ保持**: 古いスナップショットは削除（tombstone）
- **バージョン管理**: スナップショット時点のイベント数を記録
- **メタデータ**: 集約タイプ、ID、作成日時を保存

## 使用フロー

### 保存フロー

```typescript
// 1. コマンド実行
await depositCommand.execute({ accountId: '123', amount: 100 });

// 2. AccountWriteRepository.save()
//    ↓
// 3. BaseEventSourcedRepository.save()
//    - イベント保存
//    - プロジェクション更新
//    - 100イベントごとにスナップショット作成 ← ここ！
```

### 読み込みフロー

```typescript
// 1. クエリ実行
const account = await writeRepo.findById(accountId);

// 2. BaseEventSourcedRepository.findById()
//    ↓
// 3. スナップショット取得を試みる
const snapshot = await snapshotRepo.getLatest('123');

if (snapshot) {
  // スナップショットあり: 高速パス
  // スナップショット(9,900イベント時点) + 残り100イベント
  const events = await eventStore.readEventsAfterVersion(streamName, snapshot.version);
  return rehydrator.rehydrateFromSnapshot(snapshot, events);
} else {
  // スナップショットなし: 全イベントリプレイ
  const events = await eventStore.readEvents(streamName);
  return rehydrator.rehydrate(events);
}
```

## パフォーマンス比較

| イベント数 | スナップショットなし | スナップショットあり |
|-----------|---------------------|---------------------|
| 100       | 100イベント読込      | 100イベント読込      |
| 1,000     | 1,000イベント読込    | 100イベント読込      |
| 10,000    | 10,000イベント読込   | 100イベント読込      |

**スナップショット間隔の調整:**

```typescript
// デフォルト: 100イベントごと
protected static readonly SNAPSHOT_INTERVAL = 100;

// 高頻度の集約: 50イベントごと
protected static readonly SNAPSHOT_INTERVAL = 50;

// 低頻度の集約: 200イベントごと
protected static readonly SNAPSHOT_INTERVAL = 200;
```

## エラーハンドリング

スナップショットは最適化のため、エラー時も動作可能：

```typescript
try {
  await snapshotRepo.save(snapshot);
} catch (error) {
  // スナップショット保存失敗でもシステムは動作
  // 次回は全イベントリプレイで対応
  logger.warn('Snapshot save failed, will fallback to full replay', error);
}
```

## ベストプラクティス

1. **スナップショットは最適化**: システムの必須機能ではない
2. **古いスナップショットは削除**: ストレージ節約
3. **バージョン管理**: イベント数を記録して整合性確保
4. **テストは両方**: スナップショットあり・なし両方テスト
5. **モニタリング**: スナップショット作成頻度を監視

## トラブルシューティング

### スナップショットが作成されない

```typescript
// 確認: snapshotRepositoryが渡されているか
const writeRepo = new AccountWriteRepository(
  eventStore,
  projectionRegistry,
  snapshotRepo // ← これが必要
);

// 確認: 100イベント到達したか
const eventCount = await eventStore.getEventCount('account-123');
console.log(`Event count: ${eventCount}, Next snapshot at: ${Math.ceil(eventCount / 100) * 100}`);
```

### スナップショットから復元できない

```typescript
// デバッグ: スナップショット内容確認
const snapshot = await snapshotRepo.getLatest('123');
console.log('Snapshot version:', snapshot?.version);
console.log('Snapshot data:', snapshot);

// 確認: イベントバージョンとスナップショットバージョンの整合性
const allEvents = await eventStore.readEvents('account-123');
console.log('Total events:', allEvents.length);
```

## 参考

- [EventStoreDB Snapshots](https://developers.eventstore.com/server/v21.10/projections.html#user-defined-projections)
- [Axon Framework: Snapshotting](https://docs.axoniq.io/reference-guide/axon-framework/tuning/event-snapshots)
