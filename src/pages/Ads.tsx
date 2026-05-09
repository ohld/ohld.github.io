import { BackButton } from '../components/BackButton'
import { Footer } from '../components/Footer'
import { ArrowRightUpIcon } from '../components/Icons'
import { openUrl } from '../openUrl'
import { useDocumentMeta } from '../useDocumentMeta'

export function WorkTogether() {
  useDocumentMeta({
    title: 'Го поработаем — Даниил Охлопков',
    description: 'Консалтинг по AI-агентам, web3 и TON, реклама в @danokhlopkov, коллабы.',
    canonical: 'https://ohld.github.io/work-together',
  })
  return (
    <div className="page">
      <div className="subpage-header">
        <BackButton />
        <h1 className="subpage-title">Го поработаем</h1>
        <p className="subpage-subtitle">Консалтинг, реклама, коллабы</p>
      </div>

      {/* Consulting */}
      <div className="section-label">
        <span>Консалтинг</span>
        <div className="section-label-line" />
      </div>

      <div className="info-card">
        <p>
          Могу помочь с:<br />
          • Создание стартапов и продуктов<br />
          • Web3 и TON экосистема<br />
          • Экосистема Telegram, Telegram Ads<br />
          • Big Data, парсинг, аналитика
        </p>
      </div>

      <div
        className="about-card"
        onClick={() => openUrl('https://www.linkedin.com/in/danokhlopkov/', 'work', 'linkedin')}
        role="link"
      >
        <div className="nav-row-content">
          <span className="nav-row-title">LinkedIn</span>
          <span className="nav-row-subtitle">Весь опыт и бэкграунд</span>
        </div>
        <ArrowRightUpIcon size={18} style={{ opacity: 0.3 }} />
      </div>

      {/* Ads */}
      <div className="section-label">
        <span>Реклама в канале</span>
        <div className="section-label-line" />
      </div>

      <div className="info-card">
        <p className="info-card-price">$1 200</p>
        <p>
          Только нативная реклама. Сам изучаю продукт и пишу своими словами.
        </p>
      </div>

      <div className="info-card">
        <p>
          ✓ До 1000 символов + 5 картинок или 1 видео<br />
          ✓ Пометка #реклама<br />
          ✗ Скам, пирамиды, казино
        </p>
      </div>

      <div className="info-card">
        <p>
          <strong>Оплата:</strong> полная предоплата<br />
          • Крипта: USDT, USDC, TON<br />
          • Банк: EUR/USD по инвойсу<br />
          • Рубли переводом на карту
        </p>
      </div>

      <div
        className="cta-btn"
        onClick={() => openUrl('https://t.me/danokhlopkov?direct', 'cta', 'write_dm')}
        role="link"
      >
        <span>Написать в ТГ</span>
        <ArrowRightUpIcon size={20} />
      </div>

      <Footer />
    </div>
  )
}
