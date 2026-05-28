import { BackButton } from '../components/BackButton'
import { BlogCard } from '../components/BlogCard'
import { Footer } from '../components/Footer'
import { russianBlogItems } from '../blog'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'

export function BlogIndex() {
  useDocumentMeta({
    title: 'Блог — Даниил Охлопков',
    description: 'Рабочие заметки Даниила Охлопкова про AI-агентов, Claude Code, Codex, MCP, GBrain, Telegram-автоматизацию и реальные agent workflows.',
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
          Мои записи и рабочие заметки про AI-агентов, инструменты, контекст и практику разработки.
        </p>
      </div>

      <main className="blog-list" aria-label="Статьи блога">
        {russianBlogItems.map((article) => (
          <BlogCard article={article} ctaLabel="Читать" key={article.path} />
        ))}
      </main>

      <Footer />
    </div>
  )
}
