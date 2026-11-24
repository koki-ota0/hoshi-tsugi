# Google Play 公開キット — 星継

目標: **2026-12-24** までに本番公開。個人アカウントなら閉鎖テスト 12 人 × 14 日が律速。

詳細ロードマップは Notion「星継 — マーケティング・制作記録」の子ページ
[Android 1ヶ月 公開ロードマップ](https://app.notion.com/p/Android-1-2026-11-24-12-24-422cf8d45a56817f9dcfd09bf18ad392)。

## パッケージ

| 項目 | 値 |
| --- | --- |
| アプリ名 | 星継 |
| applicationId | `com.kokilux.hoshitsugi`（一度出したら変更不可） |
| 成果物 | AAB（新規 APK 不可） |
| targetSdk | 36（Android 16。2026-08-31 以降の phone/tablet 必須） |
| 向き | 縦固定 |
| 課金 | 初期は無料 + 広告。IAP は後回し |

## 人手が要るもの（エージェントでは完了できない）

1. Play Console 登録（18歳以上、**25 USD 一回**、政府発行 ID）
2. 個人アカウントの実機確認
3. 閉鎖テストのテスター **12人以上** を 14 日維持
4. AdMob アカウントとアプリ審査
5. プライバシーポリシーの **https 公開 URL**（GitHub Pages か独自ドメイン）
6. アップロード鍵 / キーストアの保管

## リポで進めたもの

- `public/privacy.html` … ポリシー全文（アプリ内とホスト用）
- `listing-ja.md` … タイトル / 短文 / 長文 / キーワード
- `data-safety.md` … Data safety 申告案
- `feature-graphic.png` … 1024×500（透過なし）
- Capacitor 設定 `capacitor.config.ts`（`npx cap add android` は Android Studio のあるマシンで）
- バックグラウンドで弾を止める / 音を止める
- ホームにプライバシー画面

## 週次

| 週 | 内容 |
| --- | --- |
| 0 今週 | Console 登録、AdMob、ポリシー URL |
| 1 | `cap add android`、AAB、アイコン、画面 |
| 2 **死守** | Closed トラック開始、12 人オプトイン |
| 3 | テスター指摘、本番 AdMob ID、動画 |
| 4 | 本番アクセス申請 → 20% → 100% |

## ローカルで Android を足す

Java 17 + Android Studio が必要。このサンドボックスには無い。

```bash
npm install
npx cap add android
npm run cap:sync
npx cap open android
```

署名は Play App Signing。アップロード鍵はリポに入れない。
