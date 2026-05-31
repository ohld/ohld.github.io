import { lazy, Suspense, useEffect, useMemo } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Home } from './pages/Home'
import { EnglishHome } from './pages/EnglishHome'
import { SiteHeader } from './components/SiteHeader'
import { trackDocumentLinkClick, trackRouteView, useScrollDepth } from './analytics'
import { enhanceCodeBlocks } from './codeBlocks'

// Routes the bot can deep-link into via t.me/ohldbot/ooo?startapp=<slug>.
// Old `closed` deeplinks remap to `private-channel` for backward compat.
const VALID_START_PARAMS = new Set([
  'about', 'posts', 'blog', 'ai-agents', 'ai-course', 'private-channel', 'closed', 'work-together', 'markdown-vs-html',
])
const START_PARAM_REDIRECTS: Record<string, string> = {
  'ai-agents': 'articles',
  'ai-course': 'articles',
  posts: 'blog',
  closed: 'private-channel',
}

const blogIndexImport = () => import('./pages/BlogIndex').then(m => ({ default: m.BlogIndex }))
const englishBlogIndexImport = () => import('./pages/EnglishBlogIndex').then(m => ({ default: m.EnglishBlogIndex }))
const articlesIndexImport = () => import('./pages/ArticlesIndex').then(m => ({ default: m.ArticlesIndex }))
const englishArticlesIndexImport = () => import('./pages/EnglishArticlesIndex').then(m => ({ default: m.EnglishArticlesIndex }))
const articlePageImport = () => import('./pages/BlogArticle').then(m => ({ default: m.BlogArticle }))
const generatedBlogPostImport = () => import('./pages/GeneratedBlogPost').then(m => ({ default: m.GeneratedBlogPost }))
const topicPageImport = () => import('./pages/TopicPage').then(m => ({ default: m.TopicPage }))
const closedImport = () => import('./pages/ClosedChannel').then(m => ({ default: m.ClosedChannel }))
const aboutImport = () => import('./pages/About').then(m => ({ default: m.About }))
const englishAboutImport = () => import('./pages/EnglishAbout').then(m => ({ default: m.EnglishAbout }))
const mvhImport = () => import('./pages/MarkdownVsHtml').then(m => ({ default: m.MarkdownVsHtml }))
const privacyImport = () => import('./pages/Privacy').then(m => ({ default: m.Privacy }))
const importedArticleImport = () => import('./pages/ImportedArticle').then(m => ({ default: m.ImportedArticle }))

const BlogIndex = lazy(blogIndexImport)
const EnglishBlogIndex = lazy(englishBlogIndexImport)
const ArticlesIndex = lazy(articlesIndexImport)
const EnglishArticlesIndex = lazy(englishArticlesIndexImport)
const ArticlePage = lazy(articlePageImport)
const GeneratedBlogPost = lazy(generatedBlogPostImport)
const TopicPage = lazy(topicPageImport)
const ClosedChannel = lazy(closedImport)
const About = lazy(aboutImport)
const EnglishAbout = lazy(englishAboutImport)
const MarkdownVsHtml = lazy(mvhImport)
const Privacy = lazy(privacyImport)
const ImportedArticle = lazy(importedArticleImport)

// Preload all chunks after home page renders so subpages open instantly
function usePreloadChunks() {
  useEffect(() => {
    const preload = () => {
      blogIndexImport()
      englishBlogIndexImport()
      articlesIndexImport()
      englishArticlesIndexImport()
      topicPageImport()
      closedImport()
      aboutImport()
      englishAboutImport()
      privacyImport()
    }
    // requestIdleCallback not available in Telegram WebView (iOS)
    const id = typeof requestIdleCallback !== 'undefined'
      ? requestIdleCallback(preload, { timeout: 3000 })
      : setTimeout(preload, 1600)
    return () => {
      typeof cancelIdleCallback !== 'undefined'
        ? cancelIdleCallback(id as number)
        : clearTimeout(id as number)
    }
  }, [])
}

function usePageTracking() {
  const location = useLocation()
  const routePath = `${location.pathname}${location.search || ''}`
  const getScrollDepth = useMemo(() => useScrollDepth(), [routePath])

  useEffect(() => {
    let firstFrame: number | null = null
    let secondFrame: number | null = null

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        trackRouteView(routePath, { source: 'react-router' })
      })
    })

    const trackBotPageView = () => {
      const initData = window.Telegram?.WebApp?.initData
      if (!window.__IS_TMA__ || !initData) return
      fetch('https://ohldbot.swanrate.com/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, page: location.pathname }),
      }).catch(() => {})
    }
    trackBotPageView()

    const onScroll = () => getScrollDepth()
    const onTelegramReady = () => trackBotPageView()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('telegram-webapp-ready', onTelegramReady)
    return () => {
      if (firstFrame !== null) window.cancelAnimationFrame(firstFrame)
      if (secondFrame !== null) window.cancelAnimationFrame(secondFrame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('telegram-webapp-ready', onTelegramReady)
    }
  }, [location.pathname, location.search, routePath, getScrollDepth])
}

function useDocumentLinkTracking() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
      ) return

      const target = event.target instanceof Element ? event.target : null
      const link = target?.closest<HTMLAnchorElement>('a[href]')
      if (link) trackDocumentLinkClick(link)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
}

function useCodeBlockEnhancement() {
  const location = useLocation()

  useEffect(() => {
    const id = window.requestAnimationFrame(() => enhanceCodeBlocks(document))
    return () => window.cancelAnimationFrame(id)
  }, [location.pathname])
}

function useStartParamNavigation() {
  const navigate = useNavigate()
  useEffect(() => {
    const maybeNavigate = () => {
      const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param
      if (startParam && VALID_START_PARAMS.has(startParam) && location.pathname === '/') {
        const target = START_PARAM_REDIRECTS[startParam] || startParam
        navigate('/' + target, { replace: true })
      }
    }
    maybeNavigate()
    window.addEventListener('telegram-webapp-ready', maybeNavigate)
    return () => window.removeEventListener('telegram-webapp-ready', maybeNavigate)
  }, [navigate])
}

function App() {
  usePreloadChunks()
  usePageTracking()
  useDocumentLinkTracking()
  useCodeBlockEnhancement()
  useStartParamNavigation()

  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ru" element={<Home />} />
          <Route path="/en" element={<EnglishHome />} />
          <Route path="/en/blog" element={<EnglishBlogIndex />} />
          <Route path="/en/blog/:slug" element={<GeneratedBlogPost />} />
          <Route path="/en/articles" element={<EnglishArticlesIndex />} />
          <Route path="/en/articles/:slug" element={<ArticlePage />} />
          <Route path="/en/about" element={<EnglishAbout />} />
          <Route path="/posts" element={<Navigate to="/ru/blog" replace />} />
          <Route path="/ru/blog" element={<BlogIndex />} />
          <Route path="/ru/blog/:slug" element={<GeneratedBlogPost />} />
          <Route path="/ru/articles" element={<ArticlesIndex />} />
          <Route path="/ru/articles/:slug" element={<ArticlePage />} />
          <Route path="/blog" element={<Navigate to="/ru/blog" replace />} />
          <Route path="/blog/hermes-agent-vs-openclaw" element={<Navigate to="/en/articles/hermes-agent-vs-openclaw" replace />} />
          <Route path="/blog/ai-tools-for-designers-design-engineering-agents" element={<Navigate to="/ru/articles/ai-tools-for-designers-design-engineering-agents" replace />} />
          <Route path="/blog/:slug" element={<GeneratedBlogPost />} />
          <Route path="/articles" element={<Navigate to="/ru/articles" replace />} />
          <Route path="/articles/:slug" element={<ArticlePage />} />
          <Route path="/topics/:slug" element={<TopicPage />} />
          <Route path="/ai-agents" element={<Navigate to="/articles" replace />} />
          <Route path="/ai-course" element={<Navigate to="/articles" replace />} />
          <Route path="/private-channel" element={<ClosedChannel />} />
          <Route path="/closed" element={<Navigate to="/private-channel" replace />} />
          <Route path="/author/okhlopkov" element={<Navigate to="/about/" replace />} />
          <Route path="/projects" element={<Navigate to="/about" replace />} />
          <Route path="/work-together" element={<Navigate to="/about" replace />} />
          <Route path="/about" element={<About />} />
          <Route path="/markdown-vs-html" element={<Navigate to="/articles/markdown-vs-html" replace />} />
          <Route path="/articles/markdown-vs-html" element={<MarkdownVsHtml />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/:slug" element={<ImportedArticle />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
