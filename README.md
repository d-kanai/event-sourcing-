# Event Sourcing Application

TypeScript x Hono x Prisma x EventStoreDB を使ったイベントソーシング実装

## アーキテクチャ

### CQRS + Event Sourcing

- **Write側**: EventStoreDBにイベントを保存
- **Read側**: SQLiteから最適化されたクエリで読み取り
- **Projection**: EventからRead Modelへの自動反映

### DDD レイヤ構造

```
backend/modules/account/
├── domain/              # ドメイン層
│   ├── entities/       # エンティティ (イベント生成)
│   ├── events/         # ドメインイベント
│   ├── value-objects/  # 値オブジェクト
│   └── repositories/   # リポジトリインターフェース
├── application/         # アプリケーション層
│   └── use-cases/      # ユースケース
├── infrastructure/      # インフラ層
│   ├── event-store/    # EventStoreDB実装
│   ├── projections/    # イベントからRead Modelへの投影
│   ├── repositories/   # リポジトリ実装
│   └── prisma/         # Prismaスキーマ
└── presentation/        # プレゼンテーション層
    └── routes/         # Honoルート
```

## セットアップ

### 1. EventStoreDB起動

```bash
docker-compose up -d
```

EventStoreDB UI: http://localhost:2113

### 2. 依存関係インストール

```bash
npm install
```

### 3. Prisma セットアップ

```bash
cd backend/modules/account/infrastructure/prisma
npx prisma migrate dev
npx prisma generate
```

### 4. アプリケーション起動

```bash
npm run dev
```

## API エンドポイント

### アカウント作成
```bash
POST /accounts
{
  "initialBalance": 1000
}
```

### アカウント取得 (Read Model)
```bash
GET /accounts/:id
```

### 入金
```bash
POST /accounts/:id/deposit
{
  "amount": 500
}
```

### 出金
```bash
POST /accounts/:id/withdraw
{
  "amount": 300
}
```

## テスト

```bash
npm test
```

### テストの特徴
- モックなしの統合テスト
- SQLiteを使用した実データベーステスト
- UseCaseのInput/Outputを確認
- 日本語のテストケース名

## イベントソーシングフロー

1. **コマンド実行** → Use Caseがドメインエンティティを操作
2. **イベント生成** → エンティティがドメインイベントを生成
3. **イベント永続化** → EventStoreDBに保存
4. **プロジェクション** → Read Model (SQLite) に投影
5. **クエリ実行** → Read ModelからSQLiteで高速読み取り

### イベントの種類

- `AccountCreated` - アカウント作成
- `MoneyDeposited` - 入金
- `MoneyWithdrawn` - 出金
- `AccountSuspended` - アカウント停止
- `AccountActivated` - アカウント有効化
- `AccountClosed` - アカウントクローズ

## 技術スタック

- **TypeScript** - 型安全性
- **Hono** - 軽量高速Webフレームワーク
- **Prisma** - ORMとマイグレーション
- **Zod** - バリデーション
- **EventStoreDB** - イベントストア
- **SQLite** - Read Model用DB
- **Jest** - テストフレームワーク
