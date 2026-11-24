# Android Studio 側（このサンドボックスでは不可）

Java 17 と Android SDK が要る。`npx cap add android` のあと:

## 必須マニフェスト

`android/app/src/main/AndroidManifest.xml` の `<activity>` に:

```
android:screenOrientation="portrait"
android:configChanges="orientation|keyboardHidden|screenSize"
android:windowSoftInputMode="adjustResize"
```

`<application>` に:

```
android:usesCleartextTraffic="false"
```

広告前は `com.google.android.gms.permission.AD_ID` を付けない。
AdMob 導入時に Play Services Ads と UMP を足し、Data safety を B 案に切り替える。

## targetSdk

`android/variables.gradle` または `app/build.gradle`:

- compileSdk / targetSdk = 36
- minSdk = 24（Capacitor 7 の既定に合わせる）

## アイコン

`docs/play-store/icon-512.png` と `public/assets/icon-512.png` を Adaptive Icon のソースにする。

## 署名

- アップロード鍵はローカルの jks。リポに入れない
- Play App Signing をオン
- `keystore.properties` は gitignore 済み

## プライバシー URL

`public/privacy.html` を GitHub Pages（`kokilux.github.io/hoshi-tsugi/privacy.html`）か同等の https に置き、
Console の「プライバシー ポリシー」とアプリ内「全文を開く」を同じ URL にする。
