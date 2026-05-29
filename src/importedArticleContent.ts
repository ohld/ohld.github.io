import importedContent from '../content/articles/imported-content.json'
import importedIndex from '../content/articles/imported-index.json'
import { applyArticleSeoEnhancement, getEnhancedArticleDescription } from './articleSeoEnhancements'

interface ImportedArticleContent {
  path: string
  bodyHtml: string
}

interface ImportedArticleMeta {
  path: string
  title: string
  description?: string
}

const importedBodies = importedContent as ImportedArticleContent[]
const importedMeta = importedIndex as ImportedArticleMeta[]

function escapeAttr(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function textFromHtml(value = '') {
  return value
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function ensureImageAlt(imgTag: string, fallbackAlt: string) {
  const alt = (fallbackAlt || 'Daniil Okhlopkov article image').trim().slice(0, 160)
  const altMatch = imgTag.match(/\s+alt(?:=(["'])(.*?)\1|=([^\s"'=<>`]+))?/i)
  const currentAlt = altMatch?.[2] || altMatch?.[3] || ''
  if (altMatch && currentAlt.trim()) return imgTag
  if (altMatch) return imgTag.replace(altMatch[0], ` alt="${escapeAttr(alt)}"`)
  return imgTag.replace(/\s*\/?>$/, (suffix) => ` alt="${escapeAttr(alt)}"${suffix.includes('/') ? ' />' : '>'}`)
}

function addMissingImageAlts(html: string, fallbackAlt: string) {
  return html
    .replace(/<figure\b[\s\S]*?<\/figure>/gi, (figure) => {
      const caption = textFromHtml(figure.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1] || '')
      return figure.replace(/<img\b[^>]*>/gi, (img) => ensureImageAlt(img, caption || fallbackAlt))
    })
    .replace(/<img\b[^>]*>/gi, (img) => ensureImageAlt(img, fallbackAlt))
}

function normalizeImportedArticleHtml(html: string, fallbackAlt: string) {
  const normalized = html
    .replace(
      /<a\b[^>]*\bhref=(["'])\/cdn-cgi\/l\/email-protection(?:#[^"']*)?\1[^>]*>[\s\S]*?<\/a>/gi,
      'DOKKU_LETSENCRYPT_EMAIL=you@example.com',
    )
    .replace(
      /\bhref=(["'])(?![a-z][a-z0-9+.-]*:|[/?#]|mailto:|tel:)([^"'\s>]+?\.[a-z]{2,}(?:[/?#][^"']*)?)\1/gi,
      (_match, quote: string, href: string) => `href=${quote}https://${href}${quote}`,
    )
  return addMissingImageAlts(normalized, fallbackAlt)
}

function canonicalPath(pathname: string) {
  const pathOnly = pathname.split('?')[0].split('#')[0] || '/'
  if (pathOnly === '/') return '/'
  return pathOnly.endsWith('/') ? pathOnly : `${pathOnly}/`
}

export function getImportedArticleBody(pathname: string) {
  const current = canonicalPath(pathname)
  const meta = importedMeta.find((article) => article.path === current)
  const fallbackAlt = meta?.title || getEnhancedArticleDescription(current, meta?.description || '') || 'Daniil Okhlopkov article image'
  const html = normalizeImportedArticleHtml(importedBodies.find((article) => article.path === current)?.bodyHtml || '', fallbackAlt)
  return applyArticleSeoEnhancement(current, html)
}
