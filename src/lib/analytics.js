const POSTHOG_KEY = process.env.REACT_APP_POSTHOG_KEY;
const POSTHOG_HOST = (process.env.REACT_APP_POSTHOG_HOST || 'https://app.posthog.com').replace(/\/$/, '');

export const track = (event, properties = {}) => {
  if (!POSTHOG_KEY || typeof window === 'undefined') {
    return;
  }

  try {
    fetch(`${POSTHOG_HOST}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event,
        properties: {
          ...properties,
          $current_url: window.location.href,
          app: 'einvoicepro'
        }
      })
    }).catch(() => {});
  } catch (_) {
    // Analytics must never interrupt the product flow.
  }
};

export const trackPageView = (path) => {
  track('$pageview', { path });
};
