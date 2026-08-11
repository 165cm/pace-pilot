# PacePilot repository guide

- Tier: T2（実用ツール）
- Category: `category-work`
- 中央規約: https://github.com/165cm/portfolio/tree/main/docs/standards
- JavaScriptと既存のZepp OS構成を維持し、小さく安全な変更を優先する。
- 変更後は`npm test`と`npm run check`を実行する。
- ZAB、`dist/`、`node_modules/`、秘密情報、個人情報をコミットしない。
- コミットとPRタイトルはConventional Commitsを使用する。
- `main`へ直接pushせず、`claude/<topic>`ブランチからPRを作成する。
