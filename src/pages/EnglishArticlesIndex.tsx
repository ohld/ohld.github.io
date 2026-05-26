import { BackButton } from '../components/BackButton'
import { BlogCard } from '../components/BlogCard'
import { Footer } from '../components/Footer'
import { englishArticleItems } from '../blog'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'

export function EnglishArticlesIndex() {
  useDocumentMeta({
    title: 'Articles — Daniil Okhlopkov',
    description: 'English tutorials and evergreen explainers by Daniil Okhlopkov about AI agents, Claude Code, Codex, MCP and automation.',
    canonical: absoluteUrl('/en/articles/'),
    lang: 'en',
    alternates: {
      ru: absoluteUrl('/articles/'),
      en: absoluteUrl('/en/articles/'),
      'x-default': absoluteUrl('/articles/'),
    },
  })

  return (
    <div className="page">
      <div className="subpage-header">
        <BackButton to="/en/" />
        <h1 className="subpage-title">Articles</h1>
        <p className="subpage-subtitle">
          English tutorials and evergreen explainers about AI agents, automation, data workflows and Telegram tools.
        </p>
      </div>

      <main className="blog-list" aria-label="English articles">
        {englishArticleItems.map((article) => (
          <BlogCard article={article} ctaLabel="Read" tagsLabel="Tags" mediaLayout="top" key={article.path} />
        ))}
      </main>

      <Footer />
    </div>
  )
}
