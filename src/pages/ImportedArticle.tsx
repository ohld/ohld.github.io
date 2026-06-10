import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ArticleLayout } from '../components/ArticleLayout'
import { loadImportedArticleBody } from '../importedArticleContent'
import {
  getImportedArticleByPath,
  importedArticleAlternates,
} from '../importedArticles'
import { getLegacyRedirect } from '../legacyRedirects'

export function ImportedArticle() {
  const location = useLocation()
  const article = getImportedArticleByPath(location.pathname)
  const legacyRedirect = getLegacyRedirect(location.pathname)
  const [bodyHtml, setBodyHtml] = useState('')
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!article || legacyRedirect) return
    let active = true
    setBodyHtml('')
    setLoadError(false)
    loadImportedArticleBody(article)
      .then((html) => {
        if (active) setBodyHtml(html)
      })
      .catch(() => {
        if (active) setLoadError(true)
      })
    return () => {
      active = false
    }
  }, [article?.path, article, legacyRedirect])

  if (legacyRedirect) return <Navigate to={legacyRedirect} replace />
  if (!article) return <Navigate to="/" replace />

  return (
    <ArticleLayout
      title={article.title}
      description={article.description}
      canonical={article.path}
      lang={article.lang}
      date={article.updatedAt}
      publishedAt={article.publishedAt}
      updatedAt={article.updatedAt}
      readingTime={article.readingTime}
      backTo={article.lang === 'en' ? '/en/blog/' : '/ru/blog/'}
      heroImage={article.heroImage}
      tags={article.tags}
      section={article.lang === 'en' ? 'Blog' : 'Блог'}
      alternates={importedArticleAlternates(article.path) || {
        [article.lang]: article.path,
        'x-default': article.path,
      }}
      bodyHtml={bodyHtml}
      bodyText={bodyHtml ? undefined : article.description}
    >
      <div className="article-loading" role={loadError ? 'alert' : 'status'}>
        {loadError
          ? article.lang === 'en' ? 'Article failed to load.' : 'Статья не загрузилась.'
          : article.lang === 'en' ? 'Loading article...' : 'Загружаю статью...'}
      </div>
    </ArticleLayout>
  )
}
