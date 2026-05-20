import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'gm_session_id';

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
    
    // Capture UTM parameters from URL if present
    const searchParams = new URLSearchParams(window.location.search);
    const urlSource = searchParams.get('utm_source');
    const urlMedium = searchParams.get('utm_medium');
    const urlCampaign = searchParams.get('utm_campaign');
    
    if (urlSource) sessionStorage.setItem('utm_source', urlSource);
    if (urlMedium) sessionStorage.setItem('utm_medium', urlMedium);
    if (urlCampaign) sessionStorage.setItem('utm_campaign', urlCampaign);
    
    // Capture Referrer on first hit
    if (!sessionStorage.getItem('referrer') && document.referrer) {
      sessionStorage.setItem('referrer', document.referrer);
    }

    // Attach saved UTMs/Referrer to ALL events so we don't lose them
    const utmSource = sessionStorage.getItem('utm_source');
    const utmMedium = sessionStorage.getItem('utm_medium');
    const utmCampaign = sessionStorage.getItem('utm_campaign');
    const referrer = sessionStorage.getItem('referrer');

    if (utmSource) finalProps.utm_source = utmSource;
    if (utmMedium) finalProps.utm_medium = utmMedium;
    if (utmCampaign) finalProps.utm_campaign = utmCampaign;
    if (referrer) finalProps.referrer = referrer;

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
