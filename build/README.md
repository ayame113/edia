## ビルド

ビルドするには`deno task build`または`deno task build:watch`コマンドを実行します。後者のコマンドはファイルが変更される度に自動でビルドが走ります。
ビルドが最新かどうか検証するには`deno task build:check`コマンドを実行します。

- `build/run.ts`: ビルドを行うスクリプト。
- `build/output.js`:
  `build/run.ts`から生成されるファイル。拡張機能で使用されます。
- `build/check.ts`: `build/output.js`が最新かどうかCIでチェックするスクリプト。

ローカルでビルドしたにもかかわらずCIで`Did you forget to run`deno task
build`?`と表示される場合は、場合はesm.shのローカルキャッシュが古い場合があります。`deno cache --reload --check ./lib/mod.ts`を試してみてください。
