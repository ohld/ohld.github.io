import { BackButton } from '../components/BackButton'
import { Footer } from '../components/Footer'
import { ArrowRightUpIcon } from '../components/Icons'
import { openUrl } from '../openUrl'
import { useDocumentMeta } from '../useDocumentMeta'

interface Role {
  title: string
  company: string
  period: string
  location: string
  description?: string
  link?: string
  linkLabel?: string
}

const experience: Role[] = [
  {
    title: 'Analytics Team Lead',
    company: 'TON Foundation',
    period: 'Sep 2025 — now',
    location: 'London, Remote',
    description: 'Строю аналитику для TON Blockchain. Dune, on-chain research, контесты для аналитиков.',
    link: 'https://dune.com/blockchains/ton',
    linkLabel: 'Dune Dashboard',
  },
  {
    title: 'Research Analyst',
    company: 'TON Foundation',
    period: 'Dec 2024 — Oct 2025',
    location: 'London, Remote',
    description: 'Making TON analyzable — инструменты, research community, ad-hoc анализ.',
  },
  {
    title: 'Senior Data Scientist',
    company: 'Sequel (VC Fund)',
    period: 'Jan — Nov 2024',
    location: 'London, On-site',
    description: 'Построил Senna — платформу автоматизации сорсинга стартапов. 28% конверсия outreach, >2 инвестиций в месяц одним человеком.',
    link: 'https://www.sequel.co/news/introducing-senna-our-proprietary-data-driven-platform',
    linkLabel: 'Подробнее',
  },
  {
    title: 'Founder In Residence',
    company: 'Entrepreneur First',
    period: 'Sep — Dec 2023',
    location: 'London',
    description: 'EF — топ-1 talent investor в мире. Backed by Patrick Collison, Reid Hoffman, Nat Friedman.',
  },
  {
    title: 'Co-Founder, CTO',
    company: 'Via Protocol',
    period: 'Aug 2021 — May 2023',
    location: 'London',
    description: 'On-chain агрегатор ликвидности. Raised ~$2M (Naval Ravikant, Shima Capital). $1.5B/year volume. Команда 8 инженеров.',
    link: 'https://www.crunchbase.com/organization/via-exchange',
    linkLabel: 'Crunchbase',
  },
  {
    title: 'Data Lead',
    company: 'Runa Capital (VC Fund)',
    period: 'Jan 2021 — Jan 2022',
    location: 'London',
    description: 'Data Platform для сорсинга стартапов. Runa Open Source Startup Index — 32k фаундеров и инвесторов. Публикации на TechCrunch.',
    link: 'https://techcrunch.com/2021/10/20/study-finds-most-big-open-source-startups-outside-bay-area-many-european-and-avoiding-vc/',
    linkLabel: 'TechCrunch',
  },
]

export function About() {
  useDocumentMeta({
    title: 'Обо мне — Даниил Охлопков',
    description: 'Head of Analytics @ TON Foundation. Опыт: InstaBot, Shazam-ботсети 13.7M юзеров, Forbes 30 under 30 (2022).',
    canonical: 'https://ohld.github.io/about/',
  })
  return (
    <div className="page">
      <div className="subpage-header">
        <BackButton />
        <h1 className="subpage-title">Обо мне</h1>
        <p className="subpage-subtitle">Данные, крипта, стартапы. Лондон.</p>
      </div>

      <div className="info-card">
        <p>
          Head of Analytics @ TON Foundation. До этого — CTO стартапа с $2M fundraise,
          data scientist в двух VC фондах, Entrepreneur First.
        </p>
        <p style={{ marginTop: 12 }}>
          Пишу про AI-агентов, on-chain аналитику и то, как строить продукты с данными.
        </p>
      </div>

      <div className="section-label">
        <span>Опыт</span>
        <div className="section-label-line" />
      </div>

      {experience.map((role, i) => (
        <div key={i} className="experience-card">
          <div className="experience-header">
            <span className="experience-title">{role.title}</span>
            <span className="experience-company">{role.company}</span>
          </div>
          <div className="experience-meta">
            <span>{role.period}</span>
            <span className="post-item-dot" />
            <span>{role.location}</span>
          </div>
          {role.description && (
            <p className="experience-desc">{role.description}</p>
          )}
          {role.link && (
            <span
              className="experience-link"
              onClick={() => openUrl(role.link!, 'about', role.linkLabel || role.company)}
              role="link"
            >
              {role.linkLabel} <ArrowRightUpIcon size={12} />
            </span>
          )}
        </div>
      ))}

      <div
        className="cta-btn"
        onClick={() => openUrl('https://www.linkedin.com/in/danokhlopkov/', 'about', 'linkedin')}
        role="link"
      >
        <span>Полный профиль на LinkedIn</span>
        <ArrowRightUpIcon size={20} />
      </div>

      <Footer />
    </div>
  )
}
