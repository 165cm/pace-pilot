# PacePilot — Developer Guide

> ユーザー向け説明は[README.md](./README.md)を参照してください。

## 技術スタック

| レイヤ | 採用技術 |
|---|---|
| プラットフォーム | Zepp OS Mini Program |
| 言語 | JavaScript |
| 対応API | API_LEVEL 3.0以上、target 4.2 |
| データ | Zepp OS LocalStorage（端末内のみ） |
| バックグラウンド | Alarm、App Service、Notification |
| テスト | Node.js標準テストランナー |

## セットアップ

Node.js 24を使用します。

```bash
git clone https://github.com/165cm/pace-pilot.git
cd pace-pilot
npm install
npm test
```

環境変数やAPIキーは使用しません。

## スクリプト

| コマンド | 役割 |
|---|---|
| `npm test` | ロジックとアセットのテスト |
| `npm run check` | JavaScript構文確認 |
| `npm run build` | Amazfit Bip 6向けZAB生成 |
| `npm run preview` | Zepp App開発者モード用QRコード生成 |

## ディレクトリ構成

```text
app-service/  Alarm境界で動くApp Service
assets/       端末内アプリアイコン
core/         タイマー・履歴・レイアウトの純粋ロジック
page/         時計上の各画面
services/     Alarm・セッション・保存処理
store/        Zepp App Store用アイコン
test/         Node.jsテスト
ui/           共通UIと履歴カード
```

## 実機プレビュー

Zepp Appで開発者モードを有効にし、次を実行します。

```bash
npm run preview
```

表示されたQRコードをZepp Appで読み取り、Amazfit Bip 6へインストールします。

## 公開ビルド

`app.json`の`app.appId`は開発用の仮値です。ストア提出前にZepp Developer
Consoleで発行された正式App IDへ置き換え、`version.code`を増やしてから
ビルドします。

```bash
npm test
npm run check
npm run build
```

生成された`dist/*.zab`はGit管理対象外です。

## AI開発メモ

- AI支援を利用して開発しています。
- リポジトリ固有の作法は[.github/AGENTS.md](./.github/AGENTS.md)を参照してください。
- 中央マニュアルは[165cm Portfolio Standards](https://github.com/165cm/portfolio/tree/main/docs/standards)です。

## ライセンス

[MIT License](./LICENSE)
