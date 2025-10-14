# Event Sourcing Application

TypeScript x Hono x Prisma x EventStoreDB を使ったイベントソーシング実装

## アーキテクチャ

### CQRS + Event Sourcing

- **Write側**: EventStoreDBにイベントを保存
- **Read側**: SQLiteから最適化されたクエリで読み取り
- **Projection**: EventからRead Modelへの自動反映

## イベントソーシングフロー

1. **コマンド実行** → Use Caseがドメインエンティティを操作
2. **イベント生成** → エンティティがドメインイベントを生成
3. **イベント永続化** → EventStoreDBに保存
4. **プロジェクション** → Read Model (SQLite) に投影
5. **クエリ実行** → Read ModelからSQLiteで高速読み取り