# Event Sourcing Application

TypeScript x Hono x Prisma x Firestore を使ったイベントソーシング実装

## マイクロサービス構成

| サービス名 | ポート | 説明 | エントリーポイント | データベース |
|-----------|--------|------|-------------------|-------------|
| User Service | 3001 | ユーザー管理サービス<br>- ユーザー登録<br>- ユーザー認証 | `modules/user/index.ts` | Firestore (Event Store)<br>PostgreSQL (Read Model) |
| Account Service | 3000 | 口座管理サービス<br>- 口座作成<br>- 入出金処理 | `modules/account/index.ts` | Firestore (Event Store)<br>PostgreSQL (Read Model) |
| Account Event Listener | - | イベント駆動処理<br>- UserCreatedイベント監視<br>- サービス間連携 | `modules/account/event-listener.ts` | Firestore (Event Source) |

## 起動方法

```bash
# 各サービスを別々のターミナルで起動

# Terminal 1: User Service
npm run dev:user

# Terminal 2: Account Service
npm run dev:account

# Terminal 3: Event Listener
npm run dev:listener

# Terminal 4: Firestore Emulator
npm run firestore:start
```

## アーキテクチャ

### CQRS + Event Sourcing

- **Write側**: Firestoreにイベントを保存
- **Read側**: PostgreSQL/SQLiteから最適化されたクエリで読み取り
- **Projection**: EventからRead Modelへの自動反映

### マイクロサービス間通信

```
User Service → Firestore Events Collection → Event Listener → Account Service
```

1. User Serviceがユーザー作成イベントをFirestoreに保存
2. Event ListenerがFirestoreをリアルタイム監視 (`onSnapshot`)
3. UserCreatedイベントを検知し、Account Serviceが処理

## イベントソーシングフロー

1. **コマンド実行** → Commandがドメインエンティティを操作
2. **イベント生成** → エンティティがドメインイベントを生成
3. **イベント永続化** → Firestoreに保存
4. **プロジェクション** → Read Model (PostgreSQL/SQLite) に投影
5. **クエリ実行** → Read ModelからSQLで高速読み取り

## 技術スタック

- **Runtime**: Node.js + TypeScript
- **Web Framework**: Hono
- **Event Store**: Firestore
- **Read Model DB**: PostgreSQL (本番), SQLite (テスト)
- **ORM**: Prisma
- **Testing**: Jest + Firebase Emulator
- **Architecture**: DDD + CQRS + Event Sourcing + Microservices
