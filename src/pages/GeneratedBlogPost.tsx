import { Navigate, useParams } from 'react-router-dom'
import { ArticleLayout } from '../components/ArticleLayout'
import { getGeneratedBlogPost } from '../generatedBlogPosts'
import { markdownToHtml } from '../markdown'
import { markdownToPlainText } from '../structuredData'

export function GeneratedBlogPost() {
  const { slug } = useParams()
  const post = getGeneratedBlogPost(slug)

  if (!post) return <Navigate to="/blog/" replace />

  return (
    <ArticleLayout
      title={post.title}
      description={post.description}
      canonical={`/blog/${post.slug}/`}
      lang={post.lang}
      date={post.updatedAt}
      publishedAt={post.publishedAt}
      updatedAt={post.updatedAt}
      readingTime={post.readingTime}
      alternates={{
        [post.lang]: `/blog/${post.slug}/`,
        'x-default': `/blog/${post.slug}/`,
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
