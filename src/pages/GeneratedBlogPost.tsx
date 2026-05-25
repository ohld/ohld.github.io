import { Link, Navigate, useParams } from 'react-router-dom'
import { BackButton } from '../components/BackButton'
import { Footer } from '../components/Footer'
import { getGeneratedBlogPost } from '../generatedBlogPosts'
import { markdownToHtml } from '../markdown'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'

export function GeneratedBlogPost() {
  const { slug } = useParams()
  const post = getGeneratedBlogPost(slug)

  if (!post) return <Navigate to="/blog/" replace />

  useDocumentMeta({
    title: `${post.title} — Даниил Охлопков`,
    description: post.description,
    canonical: absoluteUrl(`/blog/${post.slug}/`),
    lang: 'ru',
    alternates: {
      ru: absoluteUrl(`/blog/${post.slug}/`),
      'x-default': absoluteUrl(`/blog/${post.slug}/`),
    },
  })

  return (
    <div className="page">
      <article className="blog-article generated-blog-post">
        <div className="subpage-header">
          <BackButton />
          <div className="blog-article-meta">
            <span>{post.publishedAt}</span>
            <span className="content-card-dot" />
            <span>Обновлено {post.updatedAt}</span>
            <span className="content-card-dot" />
            <span>{post.readingTime}</span>
          </div>
          <h1 className="subpage-title">{post.title}</h1>
          <p className="subpage-subtitle">{post.description}</p>
        </div>

        <div
          className="generated-blog-body"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(post.body) }}
        />

        <section>
          <h2>Дальше</h2>
          <div className="related-links">
            <Link to="/blog/">Все посты блога</Link>
            <Link to="/articles/">Статьи и туториалы</Link>
            <Link to="/about/">Обо мне</Link>
          </div>
        </section>
      </article>

      <Footer />
    </div>
  )
}
