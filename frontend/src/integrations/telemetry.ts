import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'gm_session_id';

/**
 * FIRST-TOUCH pazarlama atfi — localStorage'da KALICI tutulur.
 *
 * NEDEN sessionStorage degil: sessionStorage sekme kapaninca silinir. Instagram'dan
 * gelip siteyi gezen, 3 gun sonra donup randevu alan kullanicinin atfi tamamen
 * kayboluyordu. Danisman secip randevu planlamak dusunme suresi gerektirdigi icin
 * donusumlerin cogu bu gruba giriyor. Olcum yoksa hangi icerigin randevu getirdigi
 * bilinemez ve icerik optimizasyonu korlemesine yapilir.
 *
 * FIRST-TOUCH (ilk temas) tercih edildi: kullanicinin markayi ILK kesfettigi kanal
 * kredilendirilir. Sosyal medyanin isi kesfettirmek; son tiklama cogu zaman Google'da
 * marka aramasi olur ve sosyalin katkisini gizler.
 */
const ATTR_KEY = 'gm_attribution';
const ATTR_TTL_DAYS = 90;

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  click_id?: string;
  referrer?: string;
  first_seen_at: string;
}

/** Ilk temasta yazar, sonraki ziyaretlerde DOKUNMAZ (first-touch). TTL dolunca yeniler. */
export function captureAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ATTR_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Attribution;
      const age = Date.now() - new Date(saved.first_seen_at).getTime();
      if (age < ATTR_TTL_DAYS * 86400000) return saved;
    }

    const qs = new URLSearchParams(window.location.search);
    const clickId = qs.get('gclid') || qs.get('fbclid') || qs.get('ttclid') || undefined;
    const src = qs.get('utm_source') || undefined;

    // Ne UTM ne tiklama kimligi yoksa ve referrer da yoksa kaydedecek bir sey yok
    if (!src && !clickId && !document.referrer) return null;

    const attr: Attribution = {
      utm_source: src,
      utm_medium: qs.get('utm_medium') || undefined,
      utm_campaign: qs.get('utm_campaign') || undefined,
      utm_content: qs.get('utm_content') || undefined,
      click_id: clickId,
      referrer: document.referrer || undefined,
      first_seen_at: new Date().toISOString(),
    };
    localStorage.setItem(ATTR_KEY, JSON.stringify(attr));
    return attr;
  } catch {
    return null; // localStorage kapali/dolu — atif olmadan devam et, akisi bozma
  }
}

/** Randevu olustururken payload'a eklenecek atif bilgisi. */
export function getAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ATTR_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = uuidv4();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

type FunnelEventName =
  | 'page_view'
  | 'signup_start'
  | 'signup_complete'
  | 'consultant_view'
  | 'service_select'
  | 'booking_start'
  | 'booking_payment'
  | 'booking_completed'
  | 'session_started'
  | 'session_completed';

export async function trackEvent(eventName: FunnelEventName, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  const sessionId = getOrCreateSessionId();
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api/v1';

  try {
    // If it's a page_view, try to capture UTM parameters and referrer from the URL
    let finalProps = { ...properties };
    
    // Ilk temasi KALICI olarak yakala (localStorage, 90 gun) ve her olaya ekle.
    const attr = captureAttribution() ?? getAttribution();
    if (attr) {
      if (attr.utm_source) finalProps.utm_source = attr.utm_source;
      if (attr.utm_medium) finalProps.utm_medium = attr.utm_medium;
      if (attr.utm_campaign) finalProps.utm_campaign = attr.utm_campaign;
      if (attr.utm_content) finalProps.utm_content = attr.utm_content;
      if (attr.click_id) finalProps.click_id = attr.click_id;
      if (attr.referrer) finalProps.referrer = attr.referrer;
      finalProps.attr_first_seen_at = attr.first_seen_at;
    }

    if (eventName === 'page_view') {
      finalProps.path = window.location.pathname;
    }

    const payload = {
      event_name: eventName,
      session_id: sessionId,
      properties: finalProps,
      occurred_at: new Date().toISOString(),
    };

    // We use sendBeacon if available for reliable delivery when navigating away
    // Otherwise fallback to fetch
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(`${url}/track`, blob);
    } else {
      fetch(`${url}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Telemetry tracking error:', err);
  }
}
