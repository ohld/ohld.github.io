import { Navigate, useLocation } from 'react-router-dom'
import { ArticleLayout } from '../components/ArticleLayout'
import { getImportedArticleBody } from '../importedArticleContent'
import {
  getImportedArticleByPath,
  importedArticleAlternates,
} from '../importedArticles'

export function ImportedArticle() {
  const location = useLocation()
  const article = getImportedArticleByPath(location.pathname)

  if (!article) return <Navigate to="/" replace />

  const bodyHtml = getImportedArticleBody(article.path)

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
      backTo={article.lang === 'en' ? '/en/blog/' : '/blog/'}
      heroImage={article.heroImage}
      tags={article.tags}
      section={article.lang === 'en' ? 'Blog' : 'Блог'}
      alternates={importedArticleAlternates(article.path) || {
        [article.lang]: article.path,
        'x-default': article.path,
      }}
      bodyHtml={bodyHtml}
    />
  )
}
