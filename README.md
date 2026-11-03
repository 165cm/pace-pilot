# PacePilot ![Tier](https://img.shields.io/badge/tier-utility-orange) ![Downloads](https://img.shields.io/badge/downloads-1%2C100%2B-blue) ![Countries](https://img.shields.io/badge/countries-80%2B-green)

> 腕元だけで集中と休憩を切り替えられるZepp OS向けポモドーロタイマー  
> A focused Pomodoro interval timer for your wrist on Zepp OS / Amazfit watches.

![Amazfit Bip 6で動作するPacePilot](docs/screenshots/bip6-timer.jpg)

## 日本語 (Japanese)

### これは何？

PacePilotは、定番の固定プリセット（`25 / 5` や `15 / 5`）または自分好みのカスタム時間を選んですぐに始められるAmazfit向けポモドーロタイマーです。世界80カ国以上で1,100名以上のユーザーに利用されています。

作業・休憩の自動切替、3ラウンドの進捗、終了予定時刻、一時停止、スキップ、振動通知を見やすい画面で提供します。誤タップでタイマーが終了しないよう、Stopボタンの長押し保護にも対応しています。

### 主な特徴

- **定番プリセット ＋ カスタム**: `10/5`, `15/5`, `20/10`, `25/5`, `50/10` に加え、Work（5〜90分）・Break（1〜30分）・ラウンド数（1〜12回）を自由に設定して保存可能
- **終了予定時刻と進捗の常時表示**: 開始時刻・現在時刻・終了予定時刻が一目で把握可能
- **バックグラウンド動作**: 画面消灯中やアプリ終了後でもOSアラームと振動で正確に切り替え通知
- **多言語対応**: 日本語、英語、簡体字中国語、繁体字中国語に対応
- **安心のプライバシー**: 外部通信なし・データは時計内のみで管理

### 使い方

1. `10 / 5`、`15 / 5`、`20 / 10`、`25 / 5`、`50 / 10`、またはオリジナルの「Custom」からプリセットを選びます。
   - `Custom ›` ボタンから作業時間（Work）・休憩時間（Break）・ラウンド数（Rounds）を自由に設定して保存できます。
2. `Start` を押すと、作業と休憩が自動で切り替わります。
3. 一時停止・再開・スキップが可能。終了時は誤操作防止のため `■ Stop` を**長押し**します。
4. 全ラウンド終了後、自動で完了画面を表示し履歴に記録されます。

### 対応デバイス

Zepp OS 3.0以上を搭載した各種 Amazfit スマートウォッチ（角型・丸型）：
- Amazfit Bip 6, Amazfit Active / Active 2 (Square & Round)
- Amazfit Balance, Amazfit Cheetah / Cheetah Pro
- Amazfit GTR 4, GTR Mini, T-Rex 3 など

---

## English

### What is PacePilot?

PacePilot is a clean, focused Pomodoro interval timer for Amazfit smartwatches powered by Zepp OS. Trusted by over 1,100 users across 80+ countries.

It keeps your workflow on track with automatic work/break transitions, visual 3-round progress, estimated finish time, pause/resume/skip controls, long-press stop protection against accidental taps, and background wrist vibration alerts.

### Features

- **Classic & Custom Presets**: Choose from `10/5`, `15/5`, `20/10`, `25/5` (Pomodoro standard), `50/10`, or create your own custom interval (Work 5–90 min, Break 1–30 min, Rounds 1–12).
- **Timeline Glance**: Displays Start time, Current time, and estimated End time at the top of the watch face.
- **Reliable Background Execution**: Leverages Zepp OS alarms to notify you with vibrations even when the screen is asleep.
- **Accidental Tap Protection**: Hold the Stop button to end your session so your progress is never lost by accident.
- **Multilingual Support**: Supports English, Japanese, Simplified Chinese, and Traditional Chinese.
- **Privacy-First**: Zero tracking, no external network requests, data stored locally on your device.

### How to Use

1. Choose a preset (`10 / 5`, `15 / 5`, `20 / 10`, `25 / 5`, `50 / 10`, or `Custom`).
   - Tap `Custom ›` to set your own work duration, break duration, and rounds.
2. Tap `Start` to begin.
3. Pause, resume, or skip phases anytime. To stop, **long-press** the `■ Stop` button.
4. When finished, a completion screen appears and the session is saved to your local History.

---

## 技術・開発について (Developer Guide)

開発環境、ビルド、実機プレビューについては [DEVELOPER.md](./DEVELOPER.md) を参照してください。

```bash
npm install
npm test       # ロジック・アセット・多言語テスト
npm run check  # 全JS構文チェック
npm run build  # パッケージビルド
```

## ライセンス (License)

[MIT License](./LICENSE)

## 関連リンク (Links)

- [作者ポートフォリオ (Portfolio)](https://165cm.github.io/portfolio/)
- [プライバシー方針 (Privacy Policy)](./docs/privacy-policy-en.md)
