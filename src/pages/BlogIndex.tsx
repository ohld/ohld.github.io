import { BackButton } from '../components/BackButton'
import { ArticlePreviewCard } from '../components/ArticlePreviewCard'
import { Footer } from '../components/Footer'
import { russianBlogItems } from '../blog'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'

export function BlogIndex() {
  useDocumentMeta({
    title: 'Блог — Даниил Охлопков',
    description: 'Рабочие заметки Даниила Охлопкова про AI-агентов, Claude Code, Codex, MCP, GBrain, Telegram-автоматизацию и реальные agent workflows.',
    canonical: absoluteUrl('/ru/blog/'),
    lang: 'ru',
    alternates: {
      ru: absoluteUrl('/ru/blog/'),
      en: absoluteUrl('/en/blog/'),
      'x-default': absoluteUrl('/ru/blog/'),
    },
  })

  return (
    <div className="page">
      <div className="subpage-header">
        <BackButton />
        <h1 className="subpage-title">Блог</h1>
        <p className="subpage-subtitle">
          Мои записи и рабочие заметки про AI-агентов, инструменты, контекст и рабочие флоу.
        </p>
      </div>

      <main className="blog-list blog-preview-grid" aria-label="Статьи блога">
        {russianBlogItems.map((article) => (
          <ArticlePreviewCard article={article} key={article.path} />
        ))}
      </main>

      <Footer />
    </div>
  )
}
