import legacyRedirectRows from '../content/articles/legacy-redirects.json'

interface LegacyRedirect {
  from: string
  to: string
}

const legacyRedirects = legacyRedirectRows as LegacyRedirect[]

function canonicalPath(pathname: string) {
  const pathOnly = pathname.split('?')[0].split('#')[0] || '/'
  if (pathOnly === '/') return '/'
  return pathOnly.endsWith('/') ? pathOnly : `${pathOnly}/`
}

export function getLegacyRedirect(pathname: string) {
  const current = canonicalPath(pathname)
  return legacyRedirects.find((redirect) => redirect.from === current)?.to || null
}
