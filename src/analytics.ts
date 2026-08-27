/** GA4 + Yandex Metrika event helper. */

import seoExperiments from '../content/seo-experiments.json'
import { SITE_URL } from './site'

const YM_COUNTER = 46266270
const SENSITIVE_QUERY_PREFIXES = ['tgWebApp']
const ATTRIBUTION_QUERY_PREFIXES = ['utm_']
const ATTRIBUTION_QUERY_NAMES = new Set([
  'gclid',
  'dclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'msclkid',
  'yclid',
])
const CONTENT_QUERY_NAMES = new Set(['q', 's', 'search', 'query', 'keyword'])
const METRIKA_GOAL_EVENTS = new Set([
  'telegram_subscribe_click',
  'social_follow_click',
  'lead_contact_click',
  'article_cta_click',
  'source_link_click',
  'code_copy',
  'navigation_back_click',
  'article_engaged',
  'article_read_complete',
])

type EventParamValue = string | number | undefined
type EventParams = Record<string, EventParamValue>
type TrackRouteSource = 'inline' | 'react-router' | 'fallback'
type RouteContext = {
  pagePath: string
  routeKey: string
  pageLocation: string
}
type SeoExperiment = {
  experiment_id?: string
  cluster_id?: string
  language?: string
  page_type?: string
  variant?: string
  started_at?: string
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    ym?: (counter: number, action: string, ...args: unknown[]) => void
    __INITIAL_GA_PAGE_VIEW_SENT__?: boolean
    __INITIAL_GA_PAGE_VIEW_PATH__?: string
    __INITIAL_GA_PAGE_VIEW_CONSUMED__?: boolean
    __INITIAL_METRIKA_HIT_SENT__?: boolean
    __INITIAL_METRIKA_HIT_PATH__?: string
    __GA_LAST_PAGE_VIEW_PATH__?: string
    __GA_LAST_PAGE_VIEW_ROUTE_KEY__?: string
    __GA_PAGE_VIEW_SENT_PATHS__?: Set<string>
    __LAST_TRACKED_URL__?: string
  }
}

function cleanParams(params: EventParams = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
  ) as Record<string, string | number>
}

function normalizePath(path = location.pathname) {
  const pathOnly = path.split('?')[0].split('#')[0] || '/'
  if (path === '/') return '/'
  if (pathOnly === '/') return '/'
  return pathOnly.endsWith('/') ? pathOnly : `${pathOnly}/`
}

function allowedSearch(path: string, mode: 'route' | 'location') {
  const url = new URL(path || '/', location.origin)
  const params = new URLSearchParams()

  for (const [key, value] of url.searchParams.entries()) {
    const lower = key.toLowerCase()
    if (SENSITIVE_QUERY_PREFIXES.some((prefix) => lower.startsWith(prefix.toLowerCase()))) continue
    const isAttribution =
      ATTRIBUTION_QUERY_PREFIXES.some((prefix) => lower.startsWith(prefix))
      || ATTRIBUTION_QUERY_NAMES.has(lower)
    const isContent = CONTENT_QUERY_NAMES.has(lower)
    if (mode === 'location' && (isAttribution || isContent)) params.append(key, value)
    if (mode === 'route' && isContent) params.append(key, value)
  }

  const search = params.toString()
  return search ? `?${search}` : ''
}

function routeContext(path = `${location.pathname}${location.search}`): RouteContext {
  const url = new URL(path || '/', location.origin)
  const pagePath = normalizePath(url.pathname)
  const routeSearch = allowedSearch(url.href, 'route')
  const locationSearch = allowedSearch(url.href, 'location')
  return {
    pagePath,
    routeKey: `${pagePath}${routeSearch}`,
    pageLocation: `${SITE_URL}${pagePath}${locationSearch}`,
  }
}

function readMeta(property: string) {
  return document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)?.content
}

function stripLocale(parts: string[]) {
  return ['ru', 'en'].includes(parts[0] || '') ? parts.slice(1) : parts
}

function contentGroup(path = location.pathname) {
  const normalized = normalizePath(path)
  const parts = stripLocale(normalized.split('/').filter(Boolean))
  if (normalized === '/' || normalized === '/en/') return 'landing'
  if (parts[0] === 'blog') return 'blog'
  if (parts[0] === 'articles') return 'articles'
  if (parts[0] === 'topics') return 'topic'
  if (parts[0] === 'about') return 'about'
  if (readMeta('og:type') === 'article') return 'legacy'
  return 'site'
}

function articleSlug(path = location.pathname) {
  const normalized = normalizePath(path)
  const parts = stripLocale(normalized.split('/').filter(Boolean))
  if (readMeta('og:type') !== 'article' && !['blog', 'articles'].includes(parts[0] || '')) return undefined
  return parts.at(-1)
}

function contentContext(path = location.pathname): EventParams {
  const route = routeContext(path)
  const group = contentGroup(route.pagePath)
  const section = readMeta('article:section')
  const tag = readMeta('article:tag')
  return {
    content_group: group,
    content_type: readMeta('og:type') === 'article' ? 'article' : group,
    article_slug: articleSlug(route.pagePath),
    article_topic: section || tag,
    article_lang: document.documentElement.lang || undefined,
    page_path: route.pagePath,
  }
}

const experimentsByPath = seoExperiments as Record<string, SeoExperiment>

function experimentContext(path = location.pathname): EventParams {
  const experiment = experimentsByPath[normalizePath(path)]
  if (!experiment) return {}
  return {
    experiment_id: experiment.experiment_id,
    cluster_id: experiment.cluster_id,
    experiment_language: experiment.language,
    experiment_page_type: experiment.page_type,
    experiment_variant: experiment.variant,
    experiment_started_at: experiment.started_at,
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

function isTelegramSubscribeUrl(url: URL) {
  const hostname = url.hostname.replace(/^www\./, '').toLowerCase()
  const pathname = url.pathname.replace(/\/+$/, '').toLowerCase()
  return ['t.me', 'telegram.me'].includes(hostname)
    && (pathname === '/danokhlopkov' || pathname.startsWith('/+'))
}

function rememberRouteView(route: RouteContext) {
  window.__GA_LAST_PAGE_VIEW_PATH__ = route.pagePath
  window.__GA_LAST_PAGE_VIEW_ROUTE_KEY__ = route.routeKey
  window.__LAST_TRACKED_URL__ = route.pageLocation
  if (!window.__GA_PAGE_VIEW_SENT_PATHS__) window.__GA_PAGE_VIEW_SENT_PATHS__ = new Set<string>()
  window.__GA_PAGE_VIEW_SENT_PATHS__.add(route.pagePath)
}

function sendMetrikaHit(route: RouteContext) {
  if (!window.ym) return
  const referer = window.__LAST_TRACKED_URL__ || document.referrer || undefined
  window.ym(YM_COUNTER, 'hit', route.pageLocation, cleanParams({
    title: document.title,
    referer,
  }))
}

function hasCurrentPageView(path = `${location.pathname}${location.search}`) {
  return window.__GA_LAST_PAGE_VIEW_ROUTE_KEY__ === routeContext(path).routeKey
}

function ensurePageViewBeforeEvent(path = `${location.pathname}${location.search}`) {
  if (!hasCurrentPageView(path)) {
    trackRouteView(path, { source: 'fallback' })
  }
}

function send(event: string, params?: EventParams, options: { ensurePageView?: boolean } = {}) {
  if (event !== 'page_view' && options.ensurePageView !== false) ensurePageViewBeforeEvent()
  const payload = cleanParams({ ...contentContext(), ...experimentContext(), ...params })
  if (window.gtag) {
    window.gtag('event', event, payload)
  }
  if (window.ym && METRIKA_GOAL_EVENTS.has(event)) {
    window.ym(YM_COUNTER, 'reachGoal', event, payload)
  }
}

/** Track SPA page navigation */
export function trackRouteView(
  path: string,
  options: { source?: TrackRouteSource } = {},
) {
  const route = routeContext(path)
  if (
    window.__INITIAL_GA_PAGE_VIEW_SENT__
    && !window.__INITIAL_GA_PAGE_VIEW_CONSUMED__
    && window.__INITIAL_GA_PAGE_VIEW_PATH__ === route.pagePath
  ) {
    window.__INITIAL_GA_PAGE_VIEW_CONSUMED__ = true
    if (!window.__INITIAL_METRIKA_HIT_SENT__ || window.__INITIAL_METRIKA_HIT_PATH__ !== route.pagePath) {
      sendMetrikaHit(route)
      window.__INITIAL_METRIKA_HIT_SENT__ = true
      window.__INITIAL_METRIKA_HIT_PATH__ = route.pagePath
    }
    rememberRouteView(route)
    return
  }

  if (window.__GA_LAST_PAGE_VIEW_ROUTE_KEY__ === route.routeKey) return

  if (window.gtag) {
    window.gtag('event', 'page_view', {
      ...cleanParams({
        ...contentContext(route.pagePath),
        ...experimentContext(route.pagePath),
      }),
      page_path: route.pagePath,
      page_location: route.pageLocation,
      page_title: document.title,
    })
  }
  sendMetrikaHit(route)
  rememberRouteView(route)
  if (options.source === 'inline') window.__INITIAL_METRIKA_HIT_SENT__ = true
}

export function trackPageView(path: string) {
  trackRouteView(path, { source: 'react-router' })
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

/** Track explicit back navigation controls. */
export function trackBackNavigation(destination: string, mode: 'history' | 'fallback' | 'telegram') {
  send('navigation_back_click', {
    event_category: 'navigation',
    event_label: 'back',
    click_text: 'back',
    destination: normalizePath(destination),
    navigation_mode: mode,
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
  const ctaId = link.dataset.ctaId || clickId(label)
  const params = {
    event_category: 'link',
    event_label: label,
    click_text: label,
    cta_id: ctaId,
    link_url: url.href,
    link_domain: url.hostname.replace(/^www\./, ''),
  }

  if (isInternalUrl(url)) {
    const destination = normalizePath(url.pathname)
    const event = link.classList.contains('cta-btn') || link.classList.contains('cta-btn-secondary')
      ? 'article_cta_click'
      : 'article_internal_click'
    send(event, { ...params, destination })
    return
  }

  if (isTelegramSubscribeUrl(url)) {
    send('telegram_subscribe_click', {
      ...params,
      event_category: 'subscribe',
      event_label: ctaId,
    })
    return
  }

  const isArticleCta = link.classList.contains('cta-btn')
    || link.classList.contains('cta-btn-secondary')
    || link.classList.contains('article-cta-link')
    || Boolean(link.dataset.ctaId)
  const event = isArticleCta
    ? 'article_cta_click'
    : link.closest('.blog-article, .generated-blog-body, .mvh-page, .bot-revolution-page')
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

type ArticleSectionState = {
  element: HTMLElement
  id: string
  title: string
  index: number
  wordCount: number
  visible: boolean
  viewed: boolean
  read: boolean
  attentionMs: number
  emittedAttentionMs: number
  passes: number
}

type ArticleReadingTrackerOptions = {
  sectionSelector?: string
  sectionReadSeconds?: number
  engagedSeconds?: number
  completeSeconds?: number
}

function substantialVisibility(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return { visible: false, visiblePixels: 0 }
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight
  const visiblePixels = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0))
  const requiredPixels = Math.min(rect.height * 0.5, viewportHeight * 0.45)
  return { visible: visiblePixels >= Math.max(1, requiredPixels), visiblePixels }
}

function currentScrollPercent() {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
  if (scrollHeight <= 0) return 100
  return Math.max(0, Math.min(100, Math.round((scrollTop / scrollHeight) * 100)))
}

/**
 * Measure meaningful article reading, not just scroll position.
 *
 * Sections are considered read after cumulative active, substantially-visible
 * time. Attention pauses when the tab is hidden or the reader is idle for 30s.
 */
export function startArticleReadingTracking(
  root: HTMLElement,
  options: ArticleReadingTrackerOptions = {},
) {
  const selector = options.sectionSelector || '[data-analytics-section]'
  const sectionReadMs = (options.sectionReadSeconds || 5) * 1000
  const engagedMs = (options.engagedSeconds || 15) * 1000
  const completeMs = (options.completeSeconds || 30) * 1000
  const articleContext = contentContext()
  const startedAt = performance.now()
  let lastTickAt = startedAt
  let lastActivityAt = startedAt
  let activeMs = 0
  let maxScrollPercent = currentScrollPercent()
  let maxSectionIndex = 0
  let currentSectionId = ''
  let engaged = false
  let completed = false
  let finalized = false
  let frame: number | null = null

  const sections: ArticleSectionState[] = Array.from(root.querySelectorAll<HTMLElement>(selector)).map((element, index) => ({
    element,
    id: element.dataset.analyticsSection || `section_${index + 1}`,
    title: (element.dataset.analyticsTitle || element.querySelector('h1, h2')?.textContent || `Section ${index + 1}`)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100),
    index: index + 1,
    wordCount: (element.textContent || '').trim().split(/\s+/u).filter(Boolean).length,
    visible: false,
    viewed: false,
    read: false,
    attentionMs: 0,
    emittedAttentionMs: 0,
    passes: 0,
  }))

  if (sections.length === 0) return () => {}

  const sendReadingEvent = (event: string, params: EventParams) => {
    send(event, params, { ensurePageView: !finalized })
  }

  const sharedSectionParams = (section: ArticleSectionState): EventParams => ({
    ...articleContext,
    event_category: 'article_reading',
    section_id: section.id,
    section_title: section.title,
    section_index: section.index,
    section_count: sections.length,
    section_words: section.wordCount,
    section_progress_percent: Math.round((section.index / sections.length) * 100),
  })

  const flushSectionAttention = (section: ArticleSectionState) => {
    const unreportedMs = section.attentionMs - section.emittedAttentionMs
    const attentionSeconds = Math.floor(unreportedMs / 1000)
    if (attentionSeconds < 1) return
    section.emittedAttentionMs += attentionSeconds * 1000
    sendReadingEvent('article_section_attention', {
      ...sharedSectionParams(section),
      attention_seconds: attentionSeconds,
      attention_total_seconds: Math.floor(section.attentionMs / 1000),
      section_pass: section.passes,
    })
  }

  const maybeMarkEngaged = () => {
    if (engaged || activeMs < engagedMs || sections.filter((section) => section.viewed).length < 2) return
    engaged = true
    sendReadingEvent('article_engaged', {
      ...articleContext,
      event_category: 'article_reading',
      active_seconds: Math.floor(activeMs / 1000),
      sections_viewed: sections.filter((section) => section.viewed).length,
      sections_read: sections.filter((section) => section.read).length,
      max_scroll_percent: maxScrollPercent,
    })
  }

  const maybeMarkComplete = () => {
    const conclusion = sections.at(-1)
    if (
      completed
      || activeMs < completeMs
      || maxScrollPercent < 75
      || !conclusion?.viewed
    ) return
    completed = true
    sendReadingEvent('article_read_complete', {
      ...articleContext,
      event_category: 'article_reading',
      active_seconds: Math.floor(activeMs / 1000),
      sections_viewed: sections.filter((section) => section.viewed).length,
      sections_read: sections.filter((section) => section.read).length,
      section_count: sections.length,
      max_scroll_percent: maxScrollPercent,
      completion_method: 'conclusion_reached',
    })
  }

  const activeThresholds = [10, 30, 60, 120, 180, 300]
  const firedActiveThresholds = new Set<number>()

  const refresh = () => {
    frame = null
    if (finalized) return
    const now = performance.now()
    const elapsed = Math.min(1500, Math.max(0, now - lastTickAt))
    const isActive = document.visibilityState === 'visible' && now - lastActivityAt <= 30_000
    lastTickAt = now
    maxScrollPercent = Math.max(maxScrollPercent, currentScrollPercent())

    if (isActive) activeMs += elapsed

    let currentSection: ArticleSectionState | undefined
    let currentVisiblePixels = -1

    for (const section of sections) {
      const { visible, visiblePixels } = substantialVisibility(section.element)
      if (visible && !section.visible) section.passes += 1
      if (!visible && section.visible) flushSectionAttention(section)
      section.visible = visible

      if (visible && visiblePixels > currentVisiblePixels) {
        currentSection = section
        currentVisiblePixels = visiblePixels
      }

      if (!visible) continue
      if (isActive) section.attentionMs += elapsed

      if (!section.viewed) {
        section.viewed = true
        maxSectionIndex = Math.max(maxSectionIndex, section.index)
        sendReadingEvent('article_section_view', {
          ...sharedSectionParams(section),
          max_scroll_percent: maxScrollPercent,
        })
      }

      if (!section.read && section.attentionMs >= sectionReadMs) {
        section.read = true
        sendReadingEvent('article_section_read', {
          ...sharedSectionParams(section),
          attention_seconds: Math.floor(section.attentionMs / 1000),
          active_seconds: Math.floor(activeMs / 1000),
        })
      }
    }

    if (currentSection) currentSectionId = currentSection.id

    for (const threshold of activeThresholds) {
      if (activeMs < threshold * 1000 || firedActiveThresholds.has(threshold)) continue
      firedActiveThresholds.add(threshold)
      sendReadingEvent('article_active_time', {
        ...articleContext,
        event_category: 'article_reading',
        active_seconds: threshold,
        sections_viewed: sections.filter((section) => section.viewed).length,
        sections_read: sections.filter((section) => section.read).length,
        max_scroll_percent: maxScrollPercent,
      })
    }

    maybeMarkEngaged()
    maybeMarkComplete()
  }

  const scheduleRefresh = () => {
    if (finalized) return
    lastActivityAt = performance.now()
    if (frame === null) frame = window.requestAnimationFrame(refresh)
  }

  const onVisibilityChange = () => {
    refresh()
    if (document.visibilityState === 'hidden') {
      sections.forEach(flushSectionAttention)
    } else {
      lastActivityAt = performance.now()
    }
  }

  const finalize = (reason: 'pagehide' | 'route_change') => {
    if (finalized) return
    refresh()
    sections.forEach(flushSectionAttention)
    finalized = true
    sendReadingEvent('article_read_summary', {
      ...articleContext,
      event_category: 'article_reading',
      active_seconds: Math.floor(activeMs / 1000),
      elapsed_seconds: Math.floor((performance.now() - startedAt) / 1000),
      sections_viewed: sections.filter((section) => section.viewed).length,
      sections_read: sections.filter((section) => section.read).length,
      section_count: sections.length,
      max_section_index: maxSectionIndex,
      last_section_id: currentSectionId,
      max_scroll_percent: maxScrollPercent,
      engaged_reader: engaged ? 1 : 0,
      read_complete: completed ? 1 : 0,
      exit_reason: reason,
      transport_type: 'beacon',
    })
  }

  const onPageHide = (event: PageTransitionEvent) => {
    if (event.persisted) {
      refresh()
      sections.forEach(flushSectionAttention)
      lastTickAt = performance.now()
      return
    }
    finalize('pagehide')
  }
  const onPageShow = (event: PageTransitionEvent) => {
    if (!event.persisted || finalized) return
    lastTickAt = performance.now()
    lastActivityAt = lastTickAt
    scheduleRefresh()
  }
  const interval = window.setInterval(refresh, 1000)
  const activityEvents: Array<keyof WindowEventMap> = ['scroll', 'resize', 'pointerdown', 'keydown', 'touchstart']
  activityEvents.forEach((event) => window.addEventListener(event, scheduleRefresh, { passive: true }))
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pagehide', onPageHide)
  window.addEventListener('pageshow', onPageShow)
  scheduleRefresh()

  return () => {
    window.clearInterval(interval)
    if (frame !== null) window.cancelAnimationFrame(frame)
    activityEvents.forEach((event) => window.removeEventListener(event, scheduleRefresh))
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pagehide', onPageHide)
    window.removeEventListener('pageshow', onPageShow)
    finalize('route_change')
  }
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
