const FOLDABLE_HEADING_SELECTOR = 'h2, h3, h4, h5, h6'
const FOLDED_HEADING_CLASS = 'heading-fold-collapsed'
const HIDDEN_SECTION_CLASS = 'heading-fold-hidden'
const MOBILE_SIDEBAR_QUERY = '(max-width: 767.9px)'

function initSidebar() {
  const sidebarButton = document.getElementById('sidebar-btn')
  const sidebar = document.getElementById('sidebar')
  const sidebarShade = document.getElementById('sidebar-shade')

  if (!sidebarButton || !sidebar || !sidebarShade) return
  if (sidebarButton.dataset.sidebarReady === 'true') return

  const controller = new AbortController()
  const mobileSidebarQuery = window.matchMedia(MOBILE_SIDEBAR_QUERY)
  let isOpen = false

  const syncSidebarState = () => {
    const isMobileOpen = mobileSidebarQuery.matches && isOpen
    const isSidebarVisible = !mobileSidebarQuery.matches || isMobileOpen

    sidebar.classList.toggle('show', isMobileOpen)
    sidebarShade.style.display = isMobileOpen ? 'block' : 'none'
    sidebar.toggleAttribute('inert', !isSidebarVisible)
    if (isSidebarVisible) sidebar.removeAttribute('aria-hidden')
    else sidebar.setAttribute('aria-hidden', 'true')
    sidebarButton.setAttribute('aria-expanded', String(isMobileOpen))
  }

  const closeSidebar = (restoreFocus = false) => {
    if (!isOpen) return
    const focusIsInside =
      document.activeElement instanceof Node && sidebar.contains(document.activeElement)
    isOpen = false
    syncSidebarState()
    if ((restoreFocus || focusIsInside) && mobileSidebarQuery.matches) sidebarButton.focus()
  }

  const toggleSidebar = () => {
    if (!mobileSidebarQuery.matches) return
    isOpen = !isOpen
    syncSidebarState()
  }

  const handleBreakpointChange = () => {
    const focusWillBeHidden =
      mobileSidebarQuery.matches &&
      document.activeElement instanceof Node &&
      sidebar.contains(document.activeElement)

    isOpen = false
    syncSidebarState()
    if (focusWillBeHidden) sidebarButton.focus()
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !mobileSidebarQuery.matches || !isOpen) return
    event.preventDefault()
    closeSidebar(true)
  }

  sidebarShade.addEventListener('click', () => closeSidebar(), { signal: controller.signal })
  sidebarButton.addEventListener('click', toggleSidebar, { signal: controller.signal })
  document.addEventListener('keydown', handleKeydown, { signal: controller.signal })
  mobileSidebarQuery.addEventListener('change', handleBreakpointChange, {
    signal: controller.signal
  })
  window.addEventListener(
    'pagehide',
    (event) => {
      isOpen = false
      syncSidebarState()
      if (!event.persisted) controller.abort()
    },
    { signal: controller.signal }
  )

  sidebarButton.dataset.sidebarReady = 'true'
  syncSidebarState()
}

function getHeadingLevel(element: Element | null) {
  if (!element) return 0
  const match = /^H([2-6])$/.exec(element.tagName)
  return match ? Number(match[1]) : 0
}

function isDirectContentHeading(
  element: Element | null,
  content: HTMLElement
): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    element.parentElement === content &&
    getHeadingLevel(element) > 0
  )
}

function getSectionElements(heading: HTMLElement) {
  const headingLevel = getHeadingLevel(heading)
  const elements: HTMLElement[] = []
  let sibling = heading.nextElementSibling

  while (sibling instanceof HTMLElement) {
    const siblingLevel = getHeadingLevel(sibling)
    if (siblingLevel > 0 && siblingLevel <= headingLevel) break
    elements.push(sibling)
    sibling = sibling.nextElementSibling
  }

  return elements
}

function setHeadingExpanded(heading: HTMLElement, expanded: boolean) {
  heading.classList.toggle(FOLDED_HEADING_CLASS, !expanded)
  heading
    .querySelector<HTMLButtonElement>('.heading-fold-toggle')
    ?.setAttribute('aria-expanded', String(expanded))
}

function applyHeadingFoldState(content: HTMLElement) {
  const collapsedLevels: number[] = []

  for (const child of Array.from(content.children)) {
    if (!(child instanceof HTMLElement)) continue

    const headingLevel = getHeadingLevel(child)
    if (headingLevel > 0) {
      while (
        collapsedLevels.length > 0 &&
        (collapsedLevels[collapsedLevels.length - 1] ?? 0) >= headingLevel
      ) {
        collapsedLevels.pop()
      }
    }

    const hiddenByParent = collapsedLevels.length > 0
    child.classList.toggle(HIDDEN_SECTION_CLASS, hiddenByParent)
    if (hiddenByParent) child.setAttribute('aria-hidden', 'true')
    else child.removeAttribute('aria-hidden')

    if (headingLevel > 0 && child.classList.contains(FOLDED_HEADING_CLASS)) {
      collapsedLevels.push(headingLevel)
    }
  }
}

function toggleHeading(heading: HTMLElement, content: HTMLElement) {
  setHeadingExpanded(heading, heading.classList.contains(FOLDED_HEADING_CLASS))
  applyHeadingFoldState(content)
}

function shouldIgnoreHeadingClick(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest('a, button, input, textarea, select, label'))
  )
}

function revealHashHeading(content: HTMLElement) {
  const rawHash = window.location.hash.slice(1)
  if (!rawHash) return

  let decodedHash = rawHash
  try {
    decodedHash = decodeURIComponent(rawHash)
  } catch {
    // Keep the raw hash when it is not a valid encoded URI component.
  }

  const target = document.getElementById(decodedHash)
  if (!isDirectContentHeading(target, content)) return

  const targetLevel = getHeadingLevel(target)
  const expandedAncestorLevels = new Set<number>()
  let sibling = target.previousElementSibling

  while (sibling instanceof HTMLElement) {
    const siblingLevel = getHeadingLevel(sibling)
    if (
      siblingLevel > 0 &&
      siblingLevel < targetLevel &&
      !expandedAncestorLevels.has(siblingLevel)
    ) {
      setHeadingExpanded(sibling, true)
      expandedAncestorLevels.add(siblingLevel)
    }
    sibling = sibling.previousElementSibling
  }

  applyHeadingFoldState(content)
}

function initHeadingFolds() {
  const content = document.getElementById('content')
  if (!content || content.dataset.headingFoldReady === 'true') return

  const headings = Array.from(content.children).filter((element): element is HTMLElement =>
    isDirectContentHeading(element, content)
  )

  for (const heading of headings) {
    if (!heading.matches(FOLDABLE_HEADING_SELECTOR) || getSectionElements(heading).length === 0) {
      continue
    }

    const toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.className = 'heading-fold-toggle'
    toggle.setAttribute('aria-label', 'Toggle section')
    toggle.setAttribute('aria-expanded', 'true')
    toggle.addEventListener('click', (event) => {
      event.stopPropagation()
      toggleHeading(heading, content)
    })

    heading.classList.add('heading-foldable')
    heading.insertBefore(toggle, heading.firstChild)
    heading.addEventListener('click', (event) => {
      if (!shouldIgnoreHeadingClick(event.target)) toggleHeading(heading, content)
    })
  }

  content.dataset.headingFoldReady = 'true'
  applyHeadingFoldState(content)
  revealHashHeading(content)
  window.addEventListener('hashchange', () => revealHashHeading(content))
}

export function initContentLayout() {
  initSidebar()
  initHeadingFolds()
}
