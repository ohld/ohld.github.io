const headingPattern = /<(h[23])\b([^>]*)>([\s\S]*?)<\/\1>/gi
const idAttribute = /\s+id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i

export function headingId(headingHtml: string) {
  return headingHtml
    .replace(/<br\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(x[\da-f]+|\d+);/gi, (_entity, value: string) => {
      const point = value[0].toLowerCase() === 'x' ? parseInt(value.slice(1), 16) : Number(value)
      return point <= 0x10ffff ? String.fromCodePoint(point) : ' '
    })
    .replace(/&(?:apos|rsquo);/gi, "'")
    .replace(/&[a-z][\w-]*;/gi, ' ')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’']/g, '')
    .match(/(?:[\p{L}\p{N}]\p{M}*)+/gu)
    ?.join('-') || 'section'
}

export function createHeadingIdAssigner(existingIds: Iterable<string>) {
  const usedIds = new Set(existingIds)
  return (headingHtml: string) => {
    const base = headingId(headingHtml)
    let id = base
    for (let suffix = 2; usedIds.has(id); suffix += 1) id = `${base}-${suffix}`
    usedIds.add(id)
    return id
  }
}

export function sectionLabels(lang: string) {
  return lang === 'ru'
    ? { copy: 'Скопировать ссылку на раздел', copied: 'Скопировано', error: 'Не удалось скопировать' }
    : { copy: 'Copy link to section', copied: 'Copied', error: 'Could not copy link' }
}

export function sectionControlHtml(lang: string) {
  return `<span class="article-section-control"><button type="button" class="article-section-link" aria-label="${sectionLabels(lang).copy}">#</button><span class="article-section-status" role="status"></span></span>`
}

export function withSectionLinks(html: string, lang: string) {
  const existingIds = [...html.matchAll(/<[a-z][^>]*>/gi)].flatMap(([tag]) => {
    const id = tag.match(idAttribute)
    return id ? [id[1] ?? id[2] ?? id[3]] : []
  })
  const assignId = createHeadingIdAssigner(['article-content', ...existingIds])
  const control = sectionControlHtml(lang)
  return html.replace(headingPattern, (_heading, tag: string, attrs: string, content: string) => {
    const id = idAttribute.test(attrs) ? '' : ` id="${assignId(content)}"`
    return `<${tag}${attrs}${id}>${content}${control}</${tag}>`
  })
}
