# recordings

ゲーム開発の過程を SNS で出すための、バージョンごとのデモ素材。

各フォルダは **マージされた main の一版**。後からカット・クロップできるように、同じ場面を複数アングルで残す。

```
npx tsx scripts/record-demo.ts
# or
DEMO_SHA=$(git rev-parse --short main) npx tsx scripts/record-demo.ts
```

PR をマージしたエージェントは、その版のクリップをここに追加してコミットする（`AGENTS.md`）。
