export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://ohld.github.io').replace(/\/+$/, '')

export function siteUrl(pathname = '/') {
  return `${SITE_URL}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
}
