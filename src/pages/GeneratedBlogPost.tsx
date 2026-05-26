import { Navigate, useParams } from 'react-router-dom'
import { ArticleLayout } from '../components/ArticleLayout'
import { getGeneratedBlogPost } from '../generatedBlogPosts'
import { markdownToHtml } from '../markdown'

export function GeneratedBlogPost() {
  const { slug } = useParams()
  const post = getGeneratedBlogPost(slug)

  if (!post) return <Navigate to="/blog/" replace />

  return (
    <ArticleLayout
      title={post.title}
      description={post.description}
      canonical={`/blog/${post.slug}/`}
      lang="ru"
      date={post.updatedAt}
      readingTime={post.readingTime}
      alternates={{
        ru: `/blog/${post.slug}/`,
        'x-default': `/blog/${post.slug}/`,
      }}
      heroImage={post.coverImage}
      heroAlt={post.coverAlt}
      bodyHtml={markdownToHtml(post.body)}
    />
  )
}
