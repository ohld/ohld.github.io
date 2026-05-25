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

        <aside className="article-source-note">
          <span>Блог, не SEO-статья</span>
          <p>
            Основа страницы — оригинальный Telegram-пост #{post.sourceTelegramId}. Текст поста сохранён,
            SEO-слой добавлен через заголовок, структуру, Wordstat-запросы и community insights.
          </p>
          <div className="article-source-links">
            <a href={post.sourceTelegramUrl} target="_blank" rel="noopener noreferrer">Открыть пост в Telegram</a>
            <Link to="/articles/">Все SEO-статьи отдельно</Link>
          </div>
        </aside>

        <aside className="keyword-note">
          <div>
            <span>Основной запрос</span>
            <strong>{post.primaryKeyword}</strong>
          </div>
          <div>
            <span>Дополнительные запросы</span>
            <strong>{post.secondaryKeywords.join(', ')}</strong>
          </div>
          <div>
            <span>Сигналы ohldbot</span>
            <strong>{post.views} просмотров · {post.forwards} репостов · {post.comments} комментов</strong>
          </div>
        </aside>

        <div
          className="generated-blog-body"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(post.body) }}
        />

        <section>
          <h2>Дальше</h2>
          <div className="related-links">
            <Link to="/blog/">Все посты блога</Link>
            <Link to="/articles/">SEO-статьи и туториалы</Link>
            <a href="https://t.me/ohld_chat" target="_blank" rel="noopener noreferrer">Обсудить в Telegram-чате</a>
          </div>
        </section>
      </article>

      <Footer />
    </div>
  )
}
