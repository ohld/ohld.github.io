import { Navigate, useParams } from 'react-router-dom'
import { BackButton } from '../components/BackButton'
import { BlogCard } from '../components/BlogCard'
import { Footer } from '../components/Footer'
import { absoluteUrl } from '../site'
import { getTopic, getTopicItems, isTopicIndexable, topicPath } from '../topics'
import { useDocumentMeta } from '../useDocumentMeta'

export function TopicPage() {
  const { slug } = useParams()
  const topic = getTopic(slug)
  const items = getTopicItems(slug)
  const indexable = isTopicIndexable(slug)

  if (!topic) return <Navigate to="/ru/articles/" replace />

  useDocumentMeta({
    title: `${topic.title} — Даниил Охлопков`,
    description: topic.description,
    canonical: absoluteUrl(topicPath(topic.slug)),
    lang: 'ru',
    alternates: {
      ru: absoluteUrl(topicPath(topic.slug)),
      'x-default': absoluteUrl(topicPath(topic.slug)),
    },
    robots: indexable ? 'index, follow' : 'noindex, follow',
  })

  return (
    <div className="page">
      <div className="subpage-header">
        <BackButton />
        <h1 className="subpage-title">{topic.title}</h1>
        <p className="subpage-subtitle">{topic.description}</p>
      </div>

      {Boolean(topic.featuredLinks?.length) && (
        <nav className="topic-featured-links" aria-label={`Связанные материалы по теме ${topic.title}`}>
          {topic.featuredLinks?.map((link) => (
            <a className="topic-featured-link" href={link.href} key={link.href}>
              <span>{link.label}</span>
              <small>{link.description}</small>
            </a>
          ))}
        </nav>
      )}

      <main className="blog-list" aria-label={`Материалы по теме ${topic.title}`}>
        {!items.length && (
          <article className="blog-card blog-card-no-thumb">
            <a className="blog-card-hitarea" href="/ru/articles/" aria-label="Статьи и туториалы" />
            <div className="blog-card-body">
              <h2>Статьи и туториалы</h2>
              <p>Пока здесь нет плотной подборки. Ближайшие материалы лежат в общем разделе статей.</p>
              <span className="blog-card-link">Открыть</span>
            </div>
          </article>
        )}
        {items.map((item) => (
          <BlogCard article={item} ctaLabel="Читать" key={item.path} />
        ))}
      </main>

      <Footer />
    </div>
  )
}
