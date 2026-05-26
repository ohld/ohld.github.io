/** GA4 + Yandex Metrika event helper. */

const YM_COUNTER = 46266270

type EventParamValue = string | number | undefined
type EventParams = Record<string, EventParamValue>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    ym?: (counter: number, action: string, ...args: unknown[]) => void
  }
}

function cleanParams(params: EventParams = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
  ) as Record<string, string | number>
}

function normalizePath(path = location.pathname) {
  if (path === '/') return '/'
  return path.endsWith('/') ? path : `${path}/`
}

function readMeta(property: string) {
  return document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)?.content
}

function contentGroup(path = location.pathname) {
  const normalized = normalizePath(path)
  if (normalized === '/' || normalized === '/en/') return 'landing'
  if (normalized.startsWith('/blog/')) return 'blog'
  if (normalized.startsWith('/articles/')) return 'articles'
  if (normalized.startsWith('/topics/')) return 'topic'
  if (normalized === '/about/' || normalized === '/en/about/') return 'about'
  if (readMeta('og:type') === 'article') return 'legacy'
  return 'site'
}

function articleSlug(path = location.pathname) {
  const normalized = normalizePath(path)
  const parts = normalized.split('/').filter(Boolean)
  if (readMeta('og:type') !== 'article' && !['blog', 'articles'].includes(parts[0] || '')) return undefined
  return parts.at(-1)
}

function contentContext(path = location.pathname): EventParams {
  const group = contentGroup(path)
  const section = readMeta('article:section')
  const tag = readMeta('article:tag')
  return {
    content_group: group,
    content_type: readMeta('og:type') === 'article' ? 'article' : group,
    article_slug: articleSlug(path),
    article_topic: section || tag,
    article_lang: document.documentElement.lang || undefined,
    page_path: normalizePath(path),
  }
}

function linkDomain(url: string) {
  try {
    return new URL(url, location.href).hostname.replace(/^www\./, '')
  } catch {
    return undefined
  }
}

function clickId(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 64)
}

function isInternalUrl(url: URL) {
  return url.origin === location.origin || ['okhlopkov.com', 'www.okhlopkov.com'].includes(url.hostname)
}

function send(event: string, params?: EventParams) {
  const payload = cleanParams({ ...contentContext(), ...params })
  if (window.gtag) {
    window.gtag('event', event, payload)
  }
  if (window.ym) {
    window.ym(YM_COUNTER, 'reachGoal', event, payload)
  }
}

/** Track SPA page navigation */
export function trackPageView(path: string) {
  const pagePath = normalizePath(path)
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      ...cleanParams(contentContext(pagePath)),
      page_path: pagePath,
      page_location: location.href,
      page_title: document.title,
    })
  }
  if (window.ym) {
    window.ym(YM_COUNTER, 'hit', location.href, { title: document.title, referer: document.referrer })
  }
}

/** Track outbound link click */
export function trackClick(category: string, label: string, url: string) {
  const domain = linkDomain(url)
  const event = category === 'subscribe'
    ? 'telegram_subscribe_click'
    : category === 'social'
      ? 'social_follow_click'
      : category === 'cta'
        ? 'article_cta_click'
        : category.startsWith('about')
          ? 'lead_contact_click'
          : 'article_outbound_click'
  send(event, {
    event_category: category,
    event_label: label,
    click_text: label,
    cta_id: clickId(label),
    link_url: url,
    link_domain: domain,
  })
}

/** Track share button */
export function trackShare() {
  send('content_share', { event_category: 'share', event_label: 'telegram', click_text: 'telegram' })
}

/** Track internal navigation */
export function trackNav(destination: string) {
  send('article_internal_click', {
    event_category: 'navigation',
    event_label: destination,
    destination: normalizePath(destination),
  })
}

/** Track document links rendered from markdown/static content. */
export function trackDocumentLinkClick(link: HTMLAnchorElement) {
  if (link.closest('.site-header')) return
  const href = link.getAttribute('href')
  if (!href || /^(?:#|javascript:|mailto:|tel:)/i.test(href)) return

  let url: URL
  try {
    url = new URL(link.href || href, location.href)
  } catch {
    return
  }

  const label = (link.textContent || link.getAttribute('aria-label') || url.pathname).trim().slice(0, 120)
  const params = {
    event_category: 'link',
    event_label: label,
    click_text: label,
    link_url: url.href,
    link_domain: url.hostname.replace(/^www\./, ''),
  }

  if (isInternalUrl(url)) {
    const destination = normalizePath(url.pathname)
    const event = link.classList.contains('cta-btn') || link.classList.contains('cta-btn-secondary')
      ? 'article_cta_click'
      : 'article_internal_click'
    send(event, { ...params, destination, cta_id: clickId(label) })
    return
  }

  const event = link.closest('.blog-article, .generated-blog-body, .mvh-page')
    ? 'source_link_click'
    : 'article_outbound_click'
  send(event, params)
}

export function trackCodeCopy(language: string) {
  send('code_copy', {
    event_category: 'code',
    event_label: language,
    click_text: 'copy',
  })
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
        send('article_scroll_depth', { scroll_threshold: threshold })
      }
    }
  }
}
