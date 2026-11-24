/**
 * AdMob 差し込み口。SDK が無いあいだは全部 no-op。
 * 出すタイミングは「図クリア後」と「裂れ後の任意リワード」だけ。
 * 着弾中・狙い中には呼ばない。
 */

const INTERSTITIAL_EVERY = 3;
let clearsSinceAd = 0;

export function noteStageClearedForAds(): void {
  clearsSinceAd += 1;
  if (clearsSinceAd >= INTERSTITIAL_EVERY) {
    clearsSinceAd = 0;
    void showInterstitial();
  }
}

export async function showInterstitial(): Promise<boolean> {
  return false;
}

/** 裂れ後「珠を足す」など、押したときだけ。 */
export async function showRewarded(): Promise<boolean> {
  return false;
}
