# NEXMOTION Motion Lab — 3D Air-Motor Mixer Comparison

> **Independent concept demo. Fictional brand. Not an official manufacturer website.**
> 架空ブランド「NEXMOTION INDUSTRIAL」による独立したコンセプトデモです。実在メーカーの公式サイトではありません。

エアーモーター撹拌機 3 モデルの構造と回転を、ブラウザ上の 3D で「見て・動かして・比べる」ためのインタラクティブサイトです。

## Features

- **HERO** — 起動直後から回転する 3D モデル、静的ブループリントによるローディング / WebGL 非対応時のフォールバック
- **INTERACTIVE LAB** — モデル・モータータイプ・運転条件（カタログ記載の回転数）を選び、START / STOP、PAUSE / RESUME、RESET、スロー再生倍率、回転方向（デモ）、回転軸・方向矢印・羽根軌跡・寸法・動力伝達（概念）の表示切替、部品ごとの表示/非表示、視点プリセット（ISO / FRONT / SIDE / TOP）
- **PRODUCT COMPARISON** — 3 つの独立した 3D ビューで同時再生（SYNC START）、個別再生、スロットごとのモデル/モーター切替、同一縮尺表示、差分を強調した仕様マトリクス（スマートフォンではタブ切替）
- **INSIDE THE MECHANISM** — 部品選択＋ハイライト、カメラ追従、分解表示、減速機の透視（概念図）
- **SPECIFICATIONS** — モデル別の全仕様表と「カタログ未確認」項目の明示

すべての表示値には出典区分（CATALOG / DRAWING / CONCEPT / DEMO / NO DATA）が付いています。詳細は [docs/SPEC_SOURCES.md](docs/SPEC_SOURCES.md)。

## Rotation model

- 回転は時間差分（delta time）で積分するため、フレームレートに依存しません（`src/sim/rotation.ts`）。
- 実機の参考回転数（カタログ値）とアニメーション速度（× 1/N スロー）を分離して表示します。
- 回転方向の矢印・軌跡は、モデルの実際の回転符号から生成しているため表示と動きが一致します。カタログに回転方向の記載はないため、方向切替はデモ操作です。

## Tech

Vite · React · TypeScript · Three.js · React Three Fiber · Drei · Lucide。外部 3D アセット・HDR・API への依存なし（ジオメトリとテクスチャはコードで生成）。

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build    # dist/
```

GitHub Pages へは `.github/workflows/deploy.yml` で `main` への push 時に自動デプロイされます。

## Data & assets policy

- 参考カタログ PDF、元企業名・ロゴ・連絡先、元型番はリポジトリに含めていません（`.gitignore` で `*.pdf` と `private/` を除外）。
- カタログの写真・図面は公開アセットとして使用していません。3D モデルは寸法図を参考にコードで作成した概念モデルです。
