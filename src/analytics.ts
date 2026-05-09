/** GA4 + Yandex Metrika event helper. */

const YM_COUNTER = 109129058

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    ym?: (counter: number, action: string, ...args: unknown[]) => void
  }
}

function send(event: string, params?: Record<string, string | number>) {
  if (window.gtag) {
    window.gtag('event', event, params)
  }
  if (window.ym) {
    window.ym(YM_COUNTER, 'reachGoal', event, params)
  }
}

/** Track SPA page navigation */
export function trackPageView(path: string) {
  send('page_view', { page_path: path, page_title: document.title })
  if (window.ym) {
    window.ym(YM_COUNTER, 'hit', location.href, { title: document.title, referer: document.referrer })
  }
}

/** Track outbound link click */
export function trackClick(category: string, label: string, url: string) {
  send('click', { event_category: category, event_label: label, link_url: url })
}

/** Track share button */
export function trackShare() {
  send('share', { method: 'telegram', content_type: 'course' })
}

/** Track internal navigation */
export function trackNav(destination: string) {
  send('navigate', { destination })
}

/**
 * Track scroll depth. Fires once per threshold (25/50/75/100%).
 * Telegram WebView doesn't always fire native scroll events,
 * so GA4 enhanced measurement misses engagement → duration=0.
 */
export function useScrollDepth() {
  const fired = new Set<number>()

  return () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
    if (scrollHeight <= 0) return
    const pct = Math.round((scrollTop / scrollHeight) * 100)

    for (const threshold of [25, 50, 75, 100]) {
      if (pct >= threshold && !fired.has(threshold)) {
        fired.add(threshold)
        send('scroll_depth', { percent_scrolled: threshold, page_path: location.pathname })
      }
    }
  }
}
