import { lazy, Suspense, useEffect, useMemo } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Home } from './pages/Home'
import { EnglishHome } from './pages/EnglishHome'
import { SiteHeader } from './components/SiteHeader'
import { trackPageView, useScrollDepth } from './analytics'

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
const closedImport = () => import('./pages/ClosedChannel').then(m => ({ default: m.ClosedChannel }))
const aboutImport = () => import('./pages/About').then(m => ({ default: m.About }))
const englishAboutImport = () => import('./pages/EnglishAbout').then(m => ({ default: m.EnglishAbout }))
const mvhImport = () => import('./pages/MarkdownVsHtml').then(m => ({ default: m.MarkdownVsHtml }))
const privacyImport = () => import('./pages/Privacy').then(m => ({ default: m.Privacy }))

const BlogIndex = lazy(blogIndexImport)
const EnglishBlogIndex = lazy(englishBlogIndexImport)
const ArticlesIndex = lazy(articlesIndexImport)
const EnglishArticlesIndex = lazy(englishArticlesIndexImport)
const ArticlePage = lazy(articlePageImport)
const GeneratedBlogPost = lazy(generatedBlogPostImport)
const ClosedChannel = lazy(closedImport)
const About = lazy(aboutImport)
const EnglishAbout = lazy(englishAboutImport)
const MarkdownVsHtml = lazy(mvhImport)
const Privacy = lazy(privacyImport)

// Preload all chunks after home page renders so subpages open instantly
function usePreloadChunks() {
  useEffect(() => {
    const preload = () => {
      blogIndexImport()
      englishBlogIndexImport()
      articlesIndexImport()
      englishArticlesIndexImport()
      articlePageImport()
      generatedBlogPostImport()
      closedImport()
      aboutImport()
      englishAboutImport()
      mvhImport()
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
  const getScrollDepth = useMemo(() => useScrollDepth(), [location.pathname])

  useEffect(() => {
    trackPageView(location.pathname)

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
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('telegram-webapp-ready', onTelegramReady)
    }
  }, [location.pathname, getScrollDepth])
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
  useStartParamNavigation()

  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ru" element={<Navigate to="/" replace />} />
          <Route path="/en" element={<EnglishHome />} />
          <Route path="/en/blog" element={<EnglishBlogIndex />} />
          <Route path="/en/articles" element={<EnglishArticlesIndex />} />
          <Route path="/en/about" element={<EnglishAbout />} />
          <Route path="/posts" element={<Navigate to="/blog" replace />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/ai-tools-for-designers-design-engineering-agents" element={<Navigate to="/articles/ai-tools-for-designers-design-engineering-agents" replace />} />
          <Route path="/blog/:slug" element={<GeneratedBlogPost />} />
          <Route path="/articles" element={<ArticlesIndex />} />
          <Route path="/articles/:slug" element={<ArticlePage />} />
          <Route path="/ai-agents" element={<Navigate to="/articles" replace />} />
          <Route path="/ai-course" element={<Navigate to="/articles" replace />} />
          <Route path="/private-channel" element={<ClosedChannel />} />
          <Route path="/closed" element={<Navigate to="/private-channel" replace />} />
          <Route path="/projects" element={<Navigate to="/about" replace />} />
          <Route path="/work-together" element={<Navigate to="/about" replace />} />
          <Route path="/about" element={<About />} />
          <Route path="/markdown-vs-html" element={<Navigate to="/articles/markdown-vs-html" replace />} />
          <Route path="/articles/markdown-vs-html" element={<MarkdownVsHtml />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
