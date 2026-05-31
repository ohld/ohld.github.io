import { Navigate, useLocation, useParams } from 'react-router-dom'
import { ArticleLayout } from '../components/ArticleLayout'
import { generatedBlogPath, getGeneratedBlogPost } from '../generatedBlogPosts'
import { markdownToHtml } from '../markdown'
import { markdownToPlainText } from '../structuredData'

export function GeneratedBlogPost() {
  const { slug } = useParams()
  const post = getGeneratedBlogPost(slug)
  const location = useLocation()

  if (!post) return <Navigate to="/ru/blog/" replace />
  const canonical = generatedBlogPath(post.slug, post.lang)
  const currentPath = location.pathname.endsWith('/') ? location.pathname : `${location.pathname}/`
  if (currentPath !== canonical) return <Navigate to={canonical} replace />

  return (
    <ArticleLayout
      title={post.title}
      description={post.description}
      canonical={canonical}
      lang={post.lang}
      date={post.updatedAt}
      publishedAt={post.publishedAt}
      updatedAt={post.updatedAt}
      readingTime={post.readingTime}
      alternates={{
        [post.lang]: canonical,
        'x-default': canonical,
      }}
      heroImage={post.coverImage}
      heroAlt={post.coverAlt}
      tags={post.tags}
      section={post.lang === 'en' ? 'Blog' : 'Блог'}
      bodyText={markdownToPlainText(post.body)}
      bodyHtml={markdownToHtml(post.body)}
    />
  )
}
