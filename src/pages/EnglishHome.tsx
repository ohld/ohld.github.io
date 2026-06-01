import { ArticlePreviewCard } from '../components/ArticlePreviewCard'
import { Footer } from '../components/Footer'
import { absoluteUrl } from '../site'
import { useDocumentMeta } from '../useDocumentMeta'
import { englishArticleItems, englishBlogItems } from '../blog'

const latestBlogItems = englishBlogItems.slice(0, 3)
const latestArticleItems = englishArticleItems.slice(0, 3)

export function EnglishHome() {
  useDocumentMeta({
    title: 'Daniil Okhlopkov — AI agents, data, TON and Telegram',
    description: 'Practical notes on AI agents, OpenClaw, Hermes Agent, Codex, Claude Code, MCP, TON analytics and Telegram automation by Daniil Okhlopkov.',
    canonical: absoluteUrl('/en/'),
    lang: 'en',
    alternates: {
      ru: absoluteUrl('/ru/'),
      en: absoluteUrl('/en/'),
      'x-default': absoluteUrl('/'),
    },
  })

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-header-name">Daniil Okhlopkov</h1>
        <p className="page-header-bio">
          AI-native analytics, on-chain data, Telegram and agent workflows.
          This page is for fresh writing and practical notes from the tools I
          actually test. Background, work history and links live on
          <a href="/en/about/"> About</a>.
        </p>
      </header>

      <main className="home-latest" aria-label="Latest writing">
        <section className="home-section home-latest-section" aria-labelledby="home-blog">
          <div className="home-section-heading">
            <div>
              <h2 id="home-blog">Blog</h2>
              <p>Fresh notes, tool diaries and field reports from the current workflow.</p>
            </div>
            <a className="home-section-link" href="/en/blog/">All posts</a>
          </div>
          <div className="blog-preview-grid">
            {latestBlogItems.map((article) => (
              <ArticlePreviewCard article={article} imageLoading="eager" tagsLabel="Tags" key={article.path} />
            ))}
          </div>
        </section>

        <section className="home-section home-latest-section" aria-labelledby="home-articles">
          <div className="home-section-heading">
            <div>
              <h2 id="home-articles">Articles</h2>
              <p>Denser explainers with sources, comparisons, prompts and practical takeaways.</p>
            </div>
            <a className="home-section-link" href="/en/articles/">All articles</a>
          </div>
          <div className="blog-preview-grid">
            {latestArticleItems.map((article) => (
              <ArticlePreviewCard article={article} imageLoading="eager" tagsLabel="Tags" key={article.path} />
            ))}
          </div>
        </section>

        <section className="home-section home-detail-section" aria-labelledby="home-guide">
          <h2 id="home-guide">What to Read Here</h2>
          <p>
            The homepage is a map of recent writing, not another copy of my
            resume. I keep it focused on tools and workflows that are being
            tested in actual work: AI agents, Codex and Claude Code operating
            loops, on-chain analytics, Telegram automation and personal systems
            for project memory.
          </p>
          <p>
            Short notes, setup diaries and observations from the current week go
            to the blog. Denser pieces with sources, comparisons, prompts,
            tables and takeaways go to articles. Background, work history,
            contacts and social links live on the About page, so this page can
            stay useful as a reading index instead of becoming a long profile.
          </p>
        </section>

        <section className="home-section home-detail-section" aria-labelledby="home-topics">
          <h2 id="home-topics">Main Topics</h2>
          <ul className="home-detail-list">
            <li>
              <a href="/topics/ai-agents/">AI agents</a> — practical workflows
              where an agent reads context, works with files, checks its own
              output and carries a task through to a concrete result.
            </li>
            <li>
              <a href="/topics/claude-code/">Claude Code</a> and
              <a href="/topics/codex/"> Codex</a> — skills, MCP, hooks, browser
              smoke checks, diff review and long tasks that need a controlled
              operating loop.
            </li>
            <li>
              <a href="/topics/ton-data/">TON data</a> — on-chain analytics,
              Dune, research queries, product metrics and ways to turn raw
              blockchain data into a decision a team can use.
            </li>
            <li>
              <a href="/topics/telegram-automation/">Telegram automation</a> —
              mini apps, bots, content pipelines, channels and operational
              interfaces where Telegram becomes part of the work system.
            </li>
            <li>
              <a href="/topics/second-brain/">Second brain</a> — Obsidian,
              GBrain, project memory, raw notes and rules that keep decisions
              available after long agent sessions.
            </li>
          </ul>
        </section>

        <section className="home-section home-detail-section" aria-labelledby="home-route">
          <h2 id="home-route">How to Use the Site</h2>
          <p>
            If you arrive from search on a specific article, the best next step
            is usually to stay with that page language: Russian material lives
            in <a href="/ru/blog/">Blog</a> and
            <a href="/ru/articles/"> Articles</a>, English material lives in
            <a href="/en/blog/"> Blog</a> and
            <a href="/en/articles/"> Articles</a>. The RU/EN switcher keeps
            those addresses stable instead of hiding them behind a forced
            redirect, which is better for readers and search crawlers.
          </p>
          <p>
            I try to publish notes after real use rather than writing abstract
            tool roundups: what sped up the task, where the tool broke, which
            settings are worth copying and which conclusions should be saved in
            project memory. That is why the homepage highlights the newest
            pieces with images, while the full archive stays in the section
            pages.
          </p>
        </section>

        <section className="home-section home-detail-section" aria-labelledby="home-language">
          <h2 id="home-language">Language and Routing</h2>
          <p>
            For a multilingual site, stable addresses matter more than guessing
            the language at any cost. The Russian version lives at
            <a href="/ru/"> /ru/</a>, the English version lives at
            <a href="/en/"> /en/</a>, and individual articles can keep their
            own stable URLs with hreflang links. If someone arrives from Google
            on a Russian article, the site should not suddenly send them to the
            English homepage only because of browser settings.
          </p>
          <p>
            This is the cleaner pattern for a personal blog and landing page:
            crawlers can index each language page separately, readers can switch
            language explicitly in the header, and the root domain remains a
            simple entry point. A later interface preference can remember the
            chosen language, but public URLs and canonical addresses should stay
            predictable.
          </p>
          <p>
            The practical compromise is simple: the interface can suggest a
            language, but it should not break the path someone already used. If
            a page was found through a Russian query, the Russian page should
            stand as its own result; if it was found in English, the English
            page should have the same independent life.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}
