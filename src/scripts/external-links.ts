const supportedProtocols = new Set(['http:', 'https:'])
const siteHost = 'memno.top'

function isSiteUrl(url: URL) {
  return url.origin === window.location.origin || url.hostname.replace(/^www\./, '') === siteHost
}

function getExternalUrl(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute('href')
  if (!href || href.startsWith('#')) return null

  try {
    const url = new URL(href, window.location.href)
    if (!supportedProtocols.has(url.protocol) || isSiteUrl(url)) return null
    return url
  } catch {
    return null
  }
}

function getGatewayUrl(target: URL) {
  const gateway = new URL('/go', window.location.origin)
  gateway.searchParams.set('url', target.href)
  return gateway
}

function rewriteExternalLink(anchor: HTMLAnchorElement) {
  if (anchor.hasAttribute('data-external-link-bypass')) return

  const savedTarget = anchor.dataset.externalTarget
  const target = savedTarget ? new URL(savedTarget) : getExternalUrl(anchor)
  if (!target) return

  if (!savedTarget) anchor.dataset.externalTarget = target.href
  anchor.href = getGatewayUrl(target).href
  anchor.target = '_self'
}

export function initExternalLinkGuard() {
  if (document.documentElement.hasAttribute('data-external-links-ready')) return
  document.documentElement.setAttribute('data-external-links-ready', '')

  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(rewriteExternalLink)

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return

    const target = event.target
    if (!(target instanceof Element)) return

    const anchor = target.closest<HTMLAnchorElement>('a[href]')
    if (anchor) rewriteExternalLink(anchor)
  })
}

export function initExternalGateway() {
  const urlElement = document.querySelector<HTMLElement>('[data-external-url]')
  const domainElement = document.querySelector<HTMLElement>('[data-external-domain]')
  const continueLink = document.querySelector<HTMLAnchorElement>('[data-external-continue]')
  const backButton = document.querySelector<HTMLButtonElement>('[data-external-back]')
  if (!urlElement || !domainElement || !continueLink) return

  const rawTarget = new URLSearchParams(window.location.search).get('url')
  let target: URL | null = null

  try {
    if (rawTarget) {
      const parsedTarget = new URL(rawTarget)
      if (supportedProtocols.has(parsedTarget.protocol)) target = parsedTarget
    }
  } catch {
    target = null
  }

  if (target) {
    urlElement.textContent = target.href
    urlElement.title = target.href
    domainElement.textContent = target.hostname
    continueLink.href = target.href
    continueLink.rel = 'noopener noreferrer'
    return
  }

  urlElement.textContent = '链接地址无效'
  domainElement.textContent = '无法识别目标网站'
  continueLink.removeAttribute('href')
  continueLink.setAttribute('aria-disabled', 'true')
  continueLink.classList.add('is-disabled')

  backButton?.focus()
}

export function goBackFromExternalGateway() {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    window.location.assign('/')
  }
}
