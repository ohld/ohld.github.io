import { BackButton } from '../components/BackButton'
import { Footer } from '../components/Footer'
import { ArrowRightIcon } from '../components/Icons'
import { russianBlogItems } from '../blog'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'

export function BlogIndex() {
  useDocumentMeta({
    title: 'Блог — Даниил Охлопков',
    description: 'Блог Даниила Охлопкова: Telegram-посты, переработанные в индексируемые материалы про AI-агентов, Claude Code, Codex, MCP и рабочие флоу.',
    canonical: absoluteUrl('/blog/'),
    lang: 'ru',
    alternates: {
      ru: absoluteUrl('/blog/'),
      en: absoluteUrl('/en/blog/'),
      'x-default': absoluteUrl('/blog/'),
    },
  })

  return (
    <div className="page">
      <div className="subpage-header">
        <BackButton />
        <h1 className="subpage-title">Блог</h1>
        <p className="subpage-subtitle">
          Мои Telegram-посты, сохранённые как нормальные страницы: живой текст остаётся, SEO-слой и community insights добавляются сверху.
        </p>
      </div>

      <main className="blog-list" aria-label="Статьи блога">
        {russianBlogItems.map((article) => (
          <a className="blog-card" href={article.path} key={article.path}>
            {article.thumbnail && (
              <img className="blog-card-thumb" src={article.thumbnail} alt="" loading="lazy" />
            )}
            <div className="blog-card-body">
              <div className="content-card-meta">
                <span>{article.publishedAt}</span>
                <span className="content-card-dot" />
                <span>{article.readingTime}</span>
              </div>
              <h2>{article.title}</h2>
              <p>{article.description}</p>
              <div className="blog-card-tags" aria-label="Теги">
                {article.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <span className="blog-card-link">Читать <ArrowRightIcon size={16} /></span>
            </div>
          </a>
        ))}
      </main>

      <Footer />
    </div>
  )
}
