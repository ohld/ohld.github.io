// Converts imported (Ghost) article HTML to Markdown for the .md mirrors and llms-full.txt.
// Handles the imported tag set, including nested lists and simple tables.
// Tables with rowspan/colspan are flattened; this is not a general HTML round-trip parser.
const decode = (text) => text
  .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(x[\da-f]+|\d+);/gi, (entity, value) => {
    const codepoint = value[0].toLowerCase() === 'x' ? parseInt(value.slice(1), 16) : Number(value)
    return codepoint > 0 && codepoint <= 0x10ffff ? String.fromCodePoint(codepoint) : entity
  }).replace(/&amp;/g, '&')
const strip = (html) => html.replace(/<[^>]+>/g, '')

export function htmlToMarkdown(html = '') {
  const stash = []
  const keep = (text) => `\u0000${stash.push(text) - 1}\u0000`
  const restore = (text) => text.replace(/\u0000(\d+)\u0000/g, (_match, index) => stash[index])
  const attr = (tag, name) => decode(tag.match(new RegExp(`\\b${name}=(["'])(.*?)\\1`, 'i'))?.[2] || '')
  const lists = []
  const inline = (text) => text
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_match, code) => keep(`\`${decode(strip(code))}\``))
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_match, _tag, value) => value.trim() ? `**${value.trim()}**` : '')
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_match, _tag, value) => value.trim() ? `*${value.trim()}*` : '')
    .replace(/<img\b[^>]*>/gi, (tag) => keep(`![${attr(tag, 'alt')}](${attr(tag, 'src')})`))
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, (tag, label) => {
      const href = attr(tag, 'href')
      const text = strip(label).replace(/\s+/g, ' ').trim()
      return href && text ? `[${text}](${keep(href)})` : text
    })
    .replace(/<br\s*\/?>/gi, '\n')

  const markdown = html
    .replace(/<(script|style|iframe)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_match, code) => {
      const language = code.match(/class="[^"]*language-([\w-]+)/)?.[1] || ''
      const text = decode(strip(code)).replace(/\n+$/, '')
      const fence = '`'.repeat(Math.max(3, ...[...text.matchAll(/`+/g)].map((match) => match[0].length + 1)))
      return `\n\n${keep(`${fence}${language}\n${text}\n${fence}`)}\n\n`
    })
    .replace(/<table\b[^>]*>([\s\S]*?)<\/table>/gi, (_match, table) => {
      const rows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
        [...row[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((cell) => restore(restore(decode(strip(inline(cell[1]))))).replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim()))
      if (!rows.length) return ''
      const line = (cells) => `| ${cells.join(' | ')} |`
      return `\n\n${keep([line(rows[0]), line(rows[0].map(() => '---')), ...rows.slice(1).map(line)].join('\n'))}\n\n`
    })
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_match, level, text) => `\n\n${'#'.repeat(level)} ${strip(inline(text)).replace(/\s+/g, ' ').trim()}\n\n`)
    .replace(/<(\/?)(ul|ol|li)\b[^>]*>/gi, (_match, closing, kind) => {
      kind = kind.toLowerCase()
      if (kind === 'li') {
        if (closing) return ''
        const list = lists.at(-1)
        const marker = list?.kind === 'ol' ? `${++list.count}.` : '-'
        return `\n${'    '.repeat(Math.max(0, lists.length - 1))}${marker} `
      }
      if (closing) { lists.pop(); return lists.length ? '' : '\n\n' }
      lists.push({ kind, count: 0 })
      return lists.length === 1 ? '\n\n' : ''
    })
    .replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_match, quote) => {
      const text = strip(inline(quote.replace(/<\/p>/gi, '\n\n'))).trim()
      return `\n\n${text.split('\n').map((line) => `> ${line.trim()}`.trimEnd()).join('\n')}\n\n`
    })
    .replace(/<hr\b[^>]*>/gi, '\n\n---\n\n')
    .replace(/<\/?(p|div|section|figure|figcaption|ul|article|header|footer)\b[^>]*>/gi, '\n\n')

  return restore(restore(decode(strip(inline(markdown))).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()))
}
