import { BackButton } from '../components/BackButton'
import { ArticlePreviewCard } from '../components/ArticlePreviewCard'
import { Footer } from '../components/Footer'
import { englishBlogItems } from '../blog'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'

export function EnglishBlogIndex() {
  useDocumentMeta({
    title: 'Blog — Daniil Okhlopkov',
    description: 'English blog posts by Daniil Okhlopkov about AI agents, Claude Code, Codex, MCP, data and Telegram workflows.',
    canonical: absoluteUrl('/en/blog/'),
    lang: 'en',
    alternates: {
      ru: absoluteUrl('/ru/blog/'),
      en: absoluteUrl('/en/blog/'),
      'x-default': absoluteUrl('/ru/blog/'),
    },
  })

  return (
    <div className="page">
      <div className="subpage-header">
        <BackButton to="/en/" />
        <h1 className="subpage-title">Blog</h1>
        <p className="subpage-subtitle">
          Notes and field reports about AI agents, Claude Code, Codex, MCP, data and Telegram workflows.
        </p>
      </div>

      <main className="blog-list blog-preview-grid" aria-label="English blog articles">
        {englishBlogItems.map((article) => (
          <ArticlePreviewCard article={article} tagsLabel="Tags" key={article.path} />
        ))}
      </main>

      <Footer />
    </div>
  )
}
