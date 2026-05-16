import { router, type Href } from 'expo-router';

/**
 * replace() veya kökten açılan ekranlarda geri yığını boş olabilir.
 * O durumda `router.back()` LogBox’ta GO_BACK hatası verir.
 */
export function safeRouterBack(fallback: Href = '/(tabs)/today') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
