# edia

時刻表をChart.jsによるダイヤグラムに変換する。

```ts
import { render } from "https://deno.land/x/edia/lib/mod.ts";

const table: NodeListOf<HTMLElement> = document.querySelectorAll(
  ".paper_table tr",
);
const el = await render(table);
document.body.insertAdjacentElement("afterstart", el);
```

### ディレクトリ構成

- `.vscode/`: vscode設定ファイル。
- `build/`: TypeScriptビルド関連。
- `etension/`: Chrome拡張用ファイル。
- `lib/`: ライブラリ。
- `deno.json`: Deno設定ファイル
- `manifest.json`: Chrome拡張設定ファイル

### 開発

```shell
# TypeScriptをビルドしてjsファイルを生成
> deno task build
# TypeScriptをビルドしてjsファイルを生成（ファイル変更の度に自動生成）
> deno task build:watch
# TypeScriptがビルド結果が最新かどうかチェック
> deno task build:check
# テストを実行
> deno task test
```
