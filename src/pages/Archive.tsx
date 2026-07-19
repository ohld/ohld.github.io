import { BackButton } from '../components/BackButton'
import { Footer } from '../components/Footer'
import { absoluteUrl, pageLangForPath } from '../site'
import { getAllArticleItems, getPrimaryTopicForItem, isTopicIndexable, topicPath } from '../topics'
import { useDocumentMeta } from '../useDocumentMeta'

type ArchiveLang = 'ru' | 'en' | 'zh'

interface ArchiveItem {
  path: string
  title: string
  publishedAt: string
  topicSlug: string
  topicLabel: string
  year: string
}

const langLabels: Record<ArchiveLang, string> = {
  ru: 'Русский',
  en: 'English',
  zh: '中文',
}

function archiveLangForPath(path: string): ArchiveLang {
  const lang = pageLangForPath(path)
  return lang === 'zh' ? 'zh' : lang === 'en' ? 'en' : 'ru'
}

function archiveItems() {
  return getAllArticleItems().map((item): ArchiveItem => {
    const topic = getPrimaryTopicForItem(item)
    return {
      path: item.path,
      title: item.title,
      publishedAt: item.publishedAt,
      topicSlug: topic?.slug || 'other',
      topicLabel: topic?.label || 'Other',
      year: item.publishedAt.slice(0, 4) || 'No date',
    }
  })
}

function groupArchive() {
  const byLang = new Map<ArchiveLang, ArchiveItem[]>()
  for (const item of archiveItems()) {
    const lang = archiveLangForPath(item.path)
    byLang.set(lang, [...(byLang.get(lang) || []), item])
  }

  return (['ru', 'en', 'zh'] as ArchiveLang[])
    .map((lang) => {
      const langItems = byLang.get(lang) || []
      const byTopic = new Map<string, ArchiveItem[]>()
      for (const item of langItems) {
        const key = `${item.topicSlug}::${item.topicLabel}`
        byTopic.set(key, [...(byTopic.get(key) || []), item])
      }
      return {
        lang,
        topics: [...byTopic.entries()]
          .map(([key, topicItems]) => {
            const [topicSlug, topicLabel] = key.split('::')
            const byYear = new Map<string, ArchiveItem[]>()
            for (const item of topicItems) {
              byYear.set(item.year, [...(byYear.get(item.year) || []), item])
            }
            return {
              topicSlug,
              topicLabel,
              years: [...byYear.entries()]
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([year, yearItems]) => ({ year, items: yearItems })),
            }
          })
          .sort((a, b) => a.topicLabel.localeCompare(b.topicLabel)),
      }
    })
    .filter((group) => group.topics.length)
}

export function Archive() {
  const groups = groupArchive()

  useDocumentMeta({
    title: 'Архив материалов — Даниил Охлопков',
    description: 'Полный индекс материалов okhlopkov.com по языку, теме и году: AI-агенты, Claude Code, Codex, TON, Telegram и практические разборы.',
    canonical: absoluteUrl('/archive/'),
    lang: 'ru',
    alternates: {
      ru: absoluteUrl('/archive/'),
      'x-default': absoluteUrl('/archive/'),
    },
  })

  return (
    <div className="page">
      <div className="subpage-header">
        <BackButton />
        <h1 className="subpage-title">Архив материалов</h1>
        <p className="subpage-subtitle">
          Полная карта сайта: язык, тема, год. Без промо, просто быстрые входы в тексты.
        </p>
      </div>

      <main className="blog-article" aria-label="Архив материалов">
        <p>
          <a href="/telegram-map/">Открыть смысловую карту 1 500+ постов Telegram →</a>
        </p>
        {groups.map((langGroup) => (
          <section key={langGroup.lang}>
            <h2>{langLabels[langGroup.lang]}</h2>
            {langGroup.topics.map((topicGroup) => (
              <section key={`${langGroup.lang}-${topicGroup.topicSlug}`}>
                <h3>
                  {topicGroup.topicSlug !== 'other' && isTopicIndexable(topicGroup.topicSlug) ? (
                    <a href={topicPath(topicGroup.topicSlug)}>{topicGroup.topicLabel}</a>
                  ) : topicGroup.topicLabel}
                </h3>
                {topicGroup.years.map((yearGroup) => (
                  <div key={`${langGroup.lang}-${topicGroup.topicSlug}-${yearGroup.year}`}>
                    <p className="page-header-mono">{yearGroup.year}</p>
                    <ul>
                      {yearGroup.items.map((item) => (
                        <li key={item.path}>
                          <a href={item.path}>{item.title}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ))}
          </section>
        ))}
      </main>

      <Footer />
    </div>
  )
}
