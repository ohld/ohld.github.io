import { BackButton } from '../components/BackButton'
import { BlogCard } from '../components/BlogCard'
import { Footer } from '../components/Footer'
import { russianArticleItems } from '../blog'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'

export function ArticlesIndex() {
  useDocumentMeta({
    title: 'Статьи — Даниил Охлопков',
    description: 'Туториалы, сравнения AI-инструментов и плотные разборы Даниила Охлопкова: OpenClaw, Claude Code, Codex, Cursor, MCP и agent workflows.',
    canonical: absoluteUrl('/articles/'),
    lang: 'ru',
    alternates: {
      ru: absoluteUrl('/articles/'),
      en: absoluteUrl('/en/articles/'),
      'x-default': absoluteUrl('/articles/'),
    },
  })

  return (
    <div className="page">
      <div className="subpage-header">
        <BackButton />
        <h1 className="subpage-title">Статьи</h1>
        <p className="subpage-subtitle">
          Туториалы, сравнения и практические разборы: источники, таблицы, промпты, видео и обновления поверх исходных постов.
        </p>
      </div>

      <main className="blog-list" aria-label="Статьи">
        {russianArticleItems.map((article) => (
          <BlogCard article={article} ctaLabel="Читать" mediaLayout="top" key={article.path} />
        ))}
      </main>

      <Footer />
    </div>
  )
}
