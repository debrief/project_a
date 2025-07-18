import {
  PluginConfig,
  FeedbackState,
  FakeDbStore,
  IBackChannelPlugin,
  BackChannelIconAPI,
  CaptureComment,
} from './types'
import { DatabaseService } from './services/DatabaseService'
import { seedDemoDatabaseIfNeeded } from './utils/seedDemoDatabase'
import { BackChannelIcon } from './components/BackChannelIcon'
import { BackChannelSidebar } from './components/BackChannelSidebar'

declare global {
  interface Window {
    BackChannel: {
      init: (config?: PluginConfig) => Promise<void>
      getState: () => FeedbackState
      getConfig: () => PluginConfig
      enableBackChannel: () => Promise<void>
      getDatabaseService: () => Promise<DatabaseService>
      isEnabled: boolean
    }
    BackChannelIcon: typeof BackChannelIcon
    BackChannelSidebar: typeof BackChannelSidebar
  }
}
// Force the custom element to be registered
if (typeof window !== 'undefined') {
  // Simply referencing the class ensures it's not tree-shaken
  window.BackChannelIcon = BackChannelIcon
  window.BackChannelSidebar = BackChannelSidebar
}

class BackChannelPlugin implements IBackChannelPlugin {
  private config: PluginConfig
  private state: FeedbackState
  private databaseService: DatabaseService | null = null
  private icon: BackChannelIcon | null = null
  private sidebar: BackChannelSidebar | null = null
  private isEnabled: boolean = false
  private isSelectingElement: boolean = false
  private selectionCancelButton: HTMLElement | null = null
  private currentHighlightedElement: HTMLElement | null = null
  private clickTimeout: ReturnType<typeof setTimeout> | null = null

  constructor() {
    this.config = this.getDefaultConfig()
    this.state = FeedbackState.INACTIVE
  }

  /**
   * Lazily creates and initializes the DatabaseService instance.
   */
  public async getDatabaseService(): Promise<DatabaseService> {
    if (this.databaseService) {
      return this.databaseService
    }

    let dbService: DatabaseService

    // Check if fakeData is available with database configuration
    if (typeof window !== 'undefined') {
      const fakeData = (window as unknown as { fakeData?: FakeDbStore })
        .fakeData
      if (fakeData && fakeData.databases && fakeData.databases.length > 0) {
        const firstDb = fakeData.databases[0]
        dbService = new DatabaseService(
          undefined,
          firstDb.name,
          firstDb.version
        )
      } else {
        // Use default configuration
        dbService = new DatabaseService()
      }
    } else {
      // Fallback for non-browser environments
      dbService = new DatabaseService()
    }

    // Seed demo database if needed (BEFORE opening database)
    await seedDemoDatabaseIfNeeded()

    // Initialize the service (this opens the database)
    await dbService.initialize()

    this.databaseService = dbService
    return this.databaseService
  }

  /**
   * Get default configuration for the plugin
   */
  private getDefaultConfig(): PluginConfig {
    return {
      requireInitials: false,
      storageKey: this.generateStorageKey(),
      targetSelector: '.reviewable',
      allowExport: true,
      debugMode: false,
    }
  }

  /**
   * Generate a storage key based on the current document URL
   */
  private generateStorageKey(): string {
    if (typeof window !== 'undefined' && window.location) {
      const url = new URL(window.location.href)
      return `backchannel-${url.hostname}${url.pathname}`
    }
    return 'backchannel-feedback'
  }

  /**
   * Clear BackChannel-related localStorage entries
   * Only clears cache when we're certain no valid package exists for current URL
   */
  private clearBackChannelLocalStorage(): void {
    try {
      // Only clear cache that's specific to the current URL
      const currentUrl = window.location.href
      const lastUrlCheck = localStorage.getItem('backchannel-last-url-check')

      // Only clear cache if the last URL check was for the current URL
      // This prevents clearing cache that might be valid for other documents
      if (lastUrlCheck === currentUrl) {
        localStorage.removeItem('backchannel-enabled-state')
        localStorage.removeItem('backchannel-last-url-check')
      }

      // Note: We don't clear 'backchannel-db-id', 'backchannel-url-root', or
      // 'backchannel-seed-version' as these might be valid for other documents
    } catch (error) {
      console.warn('Failed to clear BackChannel localStorage:', error)
    }
  }

  async init(config: PluginConfig = {}): Promise<void> {
    this.config = {
      ...this.getDefaultConfig(),
      ...config,
    }

    try {
      this.setupEventListeners()
    } catch (error) {
      console.error('Failed to initialize BackChannel plugin:', error)
      throw error
    }
  }

  private setupEventListeners(): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.onDOMReady().catch(error => {
          console.error('Failed to initialize UI after DOM ready:', error)
        })
      })
    } else {
      this.onDOMReady().catch(error => {
        console.error('Failed to initialize UI:', error)
      })
    }
  }

  private async onDOMReady(): Promise<void> {
    // Check if BackChannel should be enabled for this page
    // First check cache, then check for existing packages if needed
    try {
      const currentUrl = window.location.href

      // Fast path: check localStorage cache first
      const cachedEnabledState = localStorage.getItem(
        'backchannel-enabled-state'
      )
      const lastUrlCheck = localStorage.getItem('backchannel-last-url-check')

      if (cachedEnabledState !== null && lastUrlCheck === currentUrl) {
        // Cache hit - trust the cached result
        this.isEnabled = cachedEnabledState === 'true'

        // If enabled, we still need to create the database service
        if (this.isEnabled) {
          await this.getDatabaseService()
        }
      } else {
        // Cache miss or different URL - check for existing packages
        const hasExistingPackage =
          await DatabaseService.hasExistingFeedbackPackage()

        if (hasExistingPackage) {
          // Only create database service if there's an existing package
          const db = await this.getDatabaseService()
          this.isEnabled = await db.isBackChannelEnabled()
        } else {
          // No existing package, remain disabled and clear cache only if necessary
          this.isEnabled = false
          this.clearBackChannelLocalStorage()
        }
      }
    } catch (error) {
      console.error('Failed to check if BackChannel should be enabled:', error)
      // Keep isEnabled as false on error
      this.isEnabled = false
    }

    // Initialize UI components after DOM is ready
    await this.initializeUI()

    // Load existing comments and apply visual feedback
    if (this.isEnabled) {
      await this.loadExistingComments()
    }
  }

  private async initializeUI(): Promise<void> {
    try {
      // Try to create the Lit component
      const iconElement = document.createElement('backchannel-icon')

      // Check if it's a proper custom element by checking for connectedCallback
      if (
        (iconElement as unknown as { connectedCallback: () => void })
          .connectedCallback
      ) {
        // Cast to the proper type
        this.icon = iconElement as BackChannelIcon

        // Set properties directly
        this.icon.backChannelPlugin = this
        this.icon.state = this.state
        this.icon.enabled = this.isEnabled

        // Add to DOM
        document.body.appendChild(this.icon)

        // Initialize sidebar if enabled
        if (this.isEnabled) {
          await this.initializeSidebar()
        }

        // Inject styles for the icon and other components
        this.injectStyles()

        // Wait for the component to be ready
        await this.icon.updateComplete

        // Set click handler
        ;(this.icon as BackChannelIconAPI).setClickHandler(() =>
          this.handleIconClick()
        )
      } else {
        throw new Error('Lit component not properly registered')
      }
    } catch (error) {
      console.error('Failed to initialize Lit component:', error)
      this.initializeFallbackIcon()
    }
  }

  private async initializeSidebar(): Promise<void> {
    try {
      // Create sidebar element
      const sidebarElement = document.createElement('backchannel-sidebar')

      // Check if it's a proper custom element
      if (
        (sidebarElement as unknown as { connectedCallback: () => void })
          .connectedCallback
      ) {
        // Cast to the proper type
        this.sidebar = sidebarElement as BackChannelSidebar

        // Set properties
        this.sidebar.backChannelPlugin = this

        // Let the sidebar component handle its own visibility state restoration
        // This ensures the 'visible' attribute is properly set on the DOM element

        // Add event listeners for sidebar events
        this.sidebar.addEventListener('sidebar-closed', () => {
          this.handleSidebarClosed()
        })

        this.sidebar.addEventListener('start-capture', () => {
          this.handleStartCapture()
        })

        this.sidebar.addEventListener('export-comments', () => {
          this.handleExportComments()
        })

        this.sidebar.addEventListener('comment-added', (event: CustomEvent) => {
          this.handleCommentAdded(event.detail)
        })

        // Add to DOM
        document.body.appendChild(this.sidebar)

        // Update icon visibility based on sidebar state
        this.updateIconVisibility()

        // Wait for the component to be ready
        await this.sidebar.updateComplete
      } else {
        throw new Error('Sidebar Lit component not properly registered')
      }
    } catch (error) {
      console.error('Failed to initialize sidebar:', error)
    }
  }

  private initializeFallbackIcon(): void {
    // Create a basic icon element if Lit component fails
    const icon = document.createElement('div')
    icon.id = 'backchannel-icon'
    icon.setAttribute('state', this.state)
    icon.setAttribute('enabled', this.isEnabled.toString())
    icon.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 48px;
      height: 48px;
      background: #ffffff;
      border: 2px solid #007acc;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10000;
    `
    icon.innerHTML = '💬'
    icon.addEventListener('click', () => this.handleIconClick())
    document.body.appendChild(icon)
  }

  private injectStyles(): void {
    // Check if styles are already injected
    if (document.getElementById('backchannel-styles')) {
      return
    }

    const styleElement = document.createElement('style')
    styleElement.id = 'backchannel-styles'
    styleElement.textContent = `
      .backchannel-icon {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 48px;
        height: 48px;
        background: #ffffff;
        border: 2px solid #007acc;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        z-index: 10000;
        user-select: none;
      }
      
      .backchannel-icon:hover {
        background: #f8f9fa;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }
      
      .backchannel-icon:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.3);
      }
      
      .backchannel-icon.inactive {
        color: #6c757d;
        border-color: #6c757d;
      }
      
      .backchannel-icon.inactive .backchannel-icon-badge {
        fill: #6c757d;
      }
      
      .backchannel-icon.capture {
        color: #007acc;
        border-color: #007acc;
        background: #e3f2fd;
      }
      
      .backchannel-icon.capture .backchannel-icon-badge {
        fill: #007acc;
      }
      
      .backchannel-icon.review {
        color: #28a745;
        border-color: #28a745;
        background: #e8f5e8;
      }
      
      .backchannel-icon.review .backchannel-icon-badge {
        fill: #28a745;
      }
      
      @media (max-width: 768px) {
        .backchannel-icon {
          top: 15px;
          right: 15px;
          width: 44px;
          height: 44px;
        }
      }
      
      @media (max-width: 480px) {
        .backchannel-icon {
          top: 10px;
          right: 10px;
          width: 40px;
          height: 40px;
        }
      }
      
      @media print {
        .backchannel-icon {
          display: none;
        }
      }
    `

    document.head.appendChild(styleElement)
  }

  private handleIconClick(): void {
    // If not enabled, always show package creation modal
    if (!this.isEnabled) {
      if (this.icon && typeof this.icon.openPackageModal === 'function') {
        this.icon.openPackageModal()
      } else {
        console.warn('Package modal not available')
      }
      return
    }

    // If enabled, show sidebar (transition from Active to Capture mode)
    if (this.sidebar) {
      this.sidebar.show()
      this.updateIconVisibility()
    } else {
      console.warn('Sidebar not available')
    }
  }

  private handleSidebarClosed(): void {
    // Update icon visibility when sidebar is closed (transition from Capture to Active mode)
    this.updateIconVisibility()
  }

  private handleStartCapture(): void {
    // Hide sidebar temporarily for element selection
    if (this.sidebar) {
      this.sidebar.hide()
    }

    console.log('Starting element selection...')
    this.enableElementSelection()
  }

  private handleExportComments(): void {
    // TODO: Implement CSV export logic
    console.log('Exporting comments to CSV...')
  }

  private handleCommentAdded(detail: {
    comment: CaptureComment
    element: ReturnType<typeof this.getElementInfo>
  }): void {
    // Add visual feedback to the commented element
    this.addElementVisualFeedback(detail.comment, detail.element)
  }

  private updateIconVisibility(): void {
    if (!this.icon) return

    // Hide icon when sidebar is visible (Capture mode)
    // Show icon when sidebar is hidden (Active mode)
    const sidebarVisible = this.sidebar?.visible || false

    if (sidebarVisible) {
      this.icon.style.display = 'none'
    } else {
      this.icon.style.display = 'flex'
    }
  }

  private enableElementSelection(): void {
    if (this.isSelectingElement) return

    this.isSelectingElement = true
    this.createCancelButton()
    this.addSelectionEventListeners()
    this.addSelectionStyles()

    // Change cursor to indicate selection mode
    document.body.style.cursor = 'crosshair'
  }

  private disableElementSelection(): void {
    if (!this.isSelectingElement) return

    this.isSelectingElement = false
    this.removeCancelButton()
    this.removeSelectionEventListeners()
    this.removeSelectionStyles()
    this.clearHighlight()

    // Clear any pending click timeout
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout)
      this.clickTimeout = null
    }

    // Restore normal cursor
    document.body.style.cursor = ''

    // Show sidebar again
    if (this.sidebar) {
      this.sidebar.show()
    }
  }

  private createCancelButton(): void {
    if (this.selectionCancelButton) return

    this.selectionCancelButton = document.createElement('button')
    this.selectionCancelButton.id = 'backchannel-cancel-selection'
    this.selectionCancelButton.textContent = 'Cancel selection (Esc)'
    this.selectionCancelButton.setAttribute(
      'aria-label',
      'Cancel element selection'
    )
    this.selectionCancelButton.setAttribute('tabindex', '0')
    this.selectionCancelButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 12px 18px;
      font-size: 14px;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      cursor: pointer;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
      transition: all 0.2s ease;
      user-select: none;
      min-width: 140px;
      text-align: center;
    `

    // Enhanced hover effects
    this.selectionCancelButton.addEventListener('mouseenter', () => {
      if (this.selectionCancelButton) {
        this.selectionCancelButton.style.background = '#c82333'
        this.selectionCancelButton.style.transform = 'translateY(-2px)'
        this.selectionCancelButton.style.boxShadow =
          '0 6px 16px rgba(220, 53, 69, 0.4)'
      }
    })

    this.selectionCancelButton.addEventListener('mouseleave', () => {
      if (this.selectionCancelButton) {
        this.selectionCancelButton.style.background = '#dc3545'
        this.selectionCancelButton.style.transform = 'translateY(0)'
        this.selectionCancelButton.style.boxShadow =
          '0 4px 12px rgba(220, 53, 69, 0.3)'
      }
    })

    // Focus handling for accessibility
    this.selectionCancelButton.addEventListener('focus', () => {
      if (this.selectionCancelButton) {
        this.selectionCancelButton.style.outline = '2px solid #ffffff'
        this.selectionCancelButton.style.outlineOffset = '2px'
      }
    })

    this.selectionCancelButton.addEventListener('blur', () => {
      if (this.selectionCancelButton) {
        this.selectionCancelButton.style.outline = 'none'
      }
    })

    // Click handler with debouncing
    let cancelClickTimeout: ReturnType<typeof setTimeout> | null = null
    this.selectionCancelButton.addEventListener('click', e => {
      e.preventDefault()
      e.stopPropagation()

      if (cancelClickTimeout) return // Prevent rapid clicks

      cancelClickTimeout = setTimeout(() => {
        console.log('Element selection cancelled via button')
        this.disableElementSelection()
        cancelClickTimeout = null
      }, 100)
    })

    // Keyboard support
    this.selectionCancelButton.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        this.selectionCancelButton?.click()
      }
    })

    document.body.appendChild(this.selectionCancelButton)

    // Auto-focus for keyboard accessibility
    setTimeout(() => {
      this.selectionCancelButton?.focus()
    }, 100)
  }

  private removeCancelButton(): void {
    if (this.selectionCancelButton && this.selectionCancelButton.parentNode) {
      this.selectionCancelButton.parentNode.removeChild(
        this.selectionCancelButton
      )
      this.selectionCancelButton = null
    }
  }

  private addSelectionEventListeners(): void {
    // Use event delegation for better performance
    document.addEventListener('mouseover', this.handleElementHover, {
      passive: true,
    })
    document.addEventListener('mouseout', this.handleElementLeave, {
      passive: true,
    })
    document.addEventListener('click', this.handleElementClick)
    document.addEventListener('keydown', this.handleSelectionKeydown)
  }

  private removeSelectionEventListeners(): void {
    document.removeEventListener('mouseover', this.handleElementHover)
    document.removeEventListener('mouseout', this.handleElementLeave)
    document.removeEventListener('click', this.handleElementClick)
    document.removeEventListener('keydown', this.handleSelectionKeydown)
  }

  private handleElementHover = (event: MouseEvent): void => {
    if (!this.isSelectingElement) return

    const target = event.target as HTMLElement
    if (this.shouldIgnoreElement(target)) return

    // Find the most appropriate element to highlight (handle nested elements)
    const elementToHighlight = this.findBestElementToHighlight(target)

    // Only highlight if it's different from current
    if (elementToHighlight !== this.currentHighlightedElement) {
      this.highlightElement(elementToHighlight)
    }
  }

  private handleElementLeave = (event: MouseEvent): void => {
    if (!this.isSelectingElement) return

    const target = event.target as HTMLElement
    const relatedTarget = event.relatedTarget as HTMLElement

    // Don't clear highlight if moving to a child element or related element
    if (
      relatedTarget &&
      (target.contains(relatedTarget) ||
        relatedTarget.contains(target) ||
        this.shouldIgnoreElement(target))
    ) {
      return
    }

    // Use a small delay to prevent flicker when moving between elements
    setTimeout(() => {
      if (
        this.isSelectingElement &&
        this.currentHighlightedElement === target
      ) {
        this.clearHighlight()
      }
    }, 10)
  }

  private handleElementClick = (event: MouseEvent): void => {
    if (!this.isSelectingElement) return

    event.preventDefault()
    event.stopPropagation()

    const target = event.target as HTMLElement
    if (this.shouldIgnoreElement(target)) return

    // Handle potential double/rapid clicks by debouncing
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout)
    }

    this.clickTimeout = setTimeout(() => {
      // Find the best element to select (same logic as highlighting)
      const elementToSelect = this.findBestElementToHighlight(target)
      this.selectElement(elementToSelect)
      this.clickTimeout = null
    }, 100)
  }

  private handleSelectionKeydown = (event: KeyboardEvent): void => {
    if (!this.isSelectingElement) return

    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        console.log('Element selection cancelled (Escape key)')
        this.disableElementSelection()
        break

      case 'Enter':
        event.preventDefault()
        if (this.currentHighlightedElement) {
          const elementToSelect = this.findBestElementToHighlight(
            this.currentHighlightedElement
          )
          this.selectElement(elementToSelect)
        }
        break

      case 'Tab':
        // Allow tab navigation to the cancel button
        if (
          this.selectionCancelButton &&
          !this.selectionCancelButton.contains(event.target as Node)
        ) {
          event.preventDefault()
          this.selectionCancelButton.focus()
        }
        break

      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        event.preventDefault()
        this.navigateToNextElement(event.key)
        break

      case 'h':
      case 'H':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          this.showKeyboardHelp()
        }
        break
    }
  }

  private shouldIgnoreElement(element: HTMLElement): boolean {
    // Ignore BackChannel elements
    if (
      element.id === 'backchannel-cancel-selection' ||
      element.tagName === 'BACKCHANNEL-ICON' ||
      element.tagName === 'BACKCHANNEL-SIDEBAR'
    ) {
      return true
    }

    // Ignore elements that are children of BackChannel components
    if (
      element.closest('backchannel-icon') ||
      element.closest('backchannel-sidebar') ||
      element.closest('#backchannel-cancel-selection')
    ) {
      return true
    }

    // Ignore script tags, style tags, and other non-content elements
    if (
      ['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK', 'HEAD', 'TITLE'].includes(
        element.tagName
      )
    ) {
      return true
    }

    // Ignore elements with no visible content
    if (element.offsetWidth === 0 && element.offsetHeight === 0) {
      return true
    }

    // Ignore elements that are not displayed
    const computedStyle = window.getComputedStyle(element)
    if (
      computedStyle.display === 'none' ||
      computedStyle.visibility === 'hidden'
    ) {
      return true
    }

    return false
  }

  private findBestElementToHighlight(target: HTMLElement): HTMLElement {
    // Start with the target element
    let current = target

    // If target is a text node or inline element, try to find a better parent
    const inlineElements = [
      'SPAN',
      'A',
      'STRONG',
      'EM',
      'I',
      'B',
      'CODE',
      'SMALL',
    ]

    // Elements that should be selectable at their own level (don't traverse up)
    const selectableElements = [
      'LI',
      'TR',
      'TD',
      'TH',
      'BUTTON',
      'INPUT',
      'SELECT',
      'TEXTAREA',
      'OPTION',
      'H1',
      'H2',
      'H3',
      'H4',
      'H5',
      'H6',
      'P',
      'BLOCKQUOTE',
      'PRE',
      'ARTICLE',
      'SECTION',
      'ASIDE',
      'HEADER',
      'FOOTER',
      'NAV',
      'MAIN',
      'FIGURE',
      'FIGCAPTION',
    ]

    // If the target is already a selectable element, use it directly
    if (
      selectableElements.includes(target.tagName) &&
      target.textContent?.trim().length > 0 &&
      target.offsetWidth > 10 &&
      target.offsetHeight > 10
    ) {
      return target
    }

    // Walk up the DOM to find a good element to highlight
    while (current && current !== document.body) {
      // Skip if this element should be ignored
      if (this.shouldIgnoreElement(current)) {
        current = current.parentElement!
        continue
      }

      // Check if element has meaningful content or structure
      const hasContent = current.textContent?.trim().length > 0
      const hasSize = current.offsetWidth > 20 && current.offsetHeight > 20
      const isBlockElement = !inlineElements.includes(current.tagName)

      // If it's a selectable element, use it (don't traverse further up)
      if (
        selectableElements.includes(current.tagName) &&
        hasContent &&
        hasSize
      ) {
        return current
      }

      // If it's a good candidate and either block element or the original target, use it
      if (hasContent && hasSize && (isBlockElement || current === target)) {
        return current
      }

      // Move to parent
      current = current.parentElement!
    }

    // Fall back to original target if no better element found
    return target
  }

  private highlightElement(element: HTMLElement): void {
    this.clearHighlight()
    this.currentHighlightedElement = element
    element.classList.add('backchannel-highlight')

    // Add intelligent tooltip positioning based on element position
    this.positionTooltip(element)
  }

  private positionTooltip(element: HTMLElement): void {
    const rect = element.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    // Remove existing positioning classes
    element.classList.remove('tooltip-bottom', 'tooltip-left', 'tooltip-right')

    // Check if tooltip would be cut off at top (need to position below)
    if (rect.top < 40) {
      element.classList.add('tooltip-bottom')
    }

    // Check if tooltip would be cut off at left (need to position from left edge)
    if (rect.left < 100) {
      element.classList.add('tooltip-left')
    }

    // Check if tooltip would be cut off at right (need to position from right edge)
    if (rect.right > viewport.width - 100) {
      element.classList.add('tooltip-right')
    }
  }

  private clearHighlight(): void {
    if (this.currentHighlightedElement) {
      this.currentHighlightedElement.classList.remove('backchannel-highlight')
      this.currentHighlightedElement = null
    }
  }

  private selectElement(element: HTMLElement): void {
    const elementInfo = this.getElementInfo(element)

    // Disable element selection
    this.disableElementSelection()

    // Show comment form in sidebar
    if (
      this.sidebar &&
      typeof this.sidebar.showCommentFormForElement === 'function'
    ) {
      this.sidebar.showCommentFormForElement(elementInfo)
    } else {
      console.warn('Sidebar comment form not available')
    }
  }

  private getElementInfo(element: HTMLElement): {
    tagName: string
    xpath: string
    cssSelector: string
    textContent: string
    attributes: Record<string, string>
    boundingRect: DOMRect
    elementIndex: number
    parentInfo: string
  } {
    return {
      tagName: element.tagName.toLowerCase(),
      xpath: this.getXPath(element),
      cssSelector: this.getCSSSelector(element),
      textContent: element.textContent?.trim() || '',
      attributes: this.getElementAttributes(element),
      boundingRect: element.getBoundingClientRect(),
      elementIndex: this.getElementIndex(element),
      parentInfo: this.getParentInfo(element),
    }
  }

  private getXPath(element: HTMLElement): string {
    const parts: string[] = []
    let current: HTMLElement | null = element

    while (
      current &&
      current.nodeType === Node.ELEMENT_NODE &&
      current !== document.body
    ) {
      let selector = current.tagName.toLowerCase()

      // Add ID if present (makes XPath more specific and reliable)
      if (current.id) {
        selector += `[@id='${current.id}']`
        parts.unshift(selector)
        break // ID should be unique, so we can stop here
      }

      // Add class if present (for better specificity)
      if (current.className && typeof current.className === 'string') {
        const classes = current.className
          .trim()
          .split(/\s+/)
          .filter(c => c.length > 0 && !c.startsWith('backchannel-')) // Exclude BackChannel classes
        if (classes.length > 0) {
          // Use the first class for specificity
          selector += `[@class='${classes[0]}']`
        }
      }

      // Always add position among siblings with the same tag to ensure uniqueness
      const siblings = Array.from(current.parentNode?.children || [])
      const sameTagSiblings = siblings.filter(
        sibling =>
          sibling.tagName.toLowerCase() === current!.tagName.toLowerCase()
      )

      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(current) + 1
        selector += `[${index}]`
      }

      parts.unshift(selector)
      current = current.parentElement
    }

    return '//' + parts.join('/') // Use // instead of / for better compatibility
  }

  private getElementAttributes(element: HTMLElement): Record<string, string> {
    const attributes: Record<string, string> = {}

    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i]
      attributes[attr.name] = attr.value
    }

    return attributes
  }

  private getCSSSelector(element: HTMLElement): string {
    const parts: string[] = []
    let current: HTMLElement | null = element

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase()

      // Use ID if available (most specific)
      if (current.id) {
        selector += `#${current.id}`
        parts.unshift(selector)
        break
      }

      // Use class if available
      if (current.className && typeof current.className === 'string') {
        const classes = current.className
          .trim()
          .split(/\s+/)
          .filter(c => c.length > 0 && !c.startsWith('backchannel-')) // Exclude BackChannel classes
        if (classes.length > 0) {
          selector += `.${classes[0]}`
        }
      }

      // Add nth-child if needed for specificity
      if (current.parentElement) {
        const siblings = Array.from(current.parentElement.children)
        const index = siblings.indexOf(current)
        if (siblings.length > 1) {
          selector += `:nth-child(${index + 1})`
        }
      }

      parts.unshift(selector)
      current = current.parentElement
    }

    return parts.join(' > ')
  }

  private getElementIndex(element: HTMLElement): number {
    if (!element.parentElement) return 0

    const siblings = Array.from(element.parentElement.children)
    return siblings.indexOf(element)
  }

  private getParentInfo(element: HTMLElement): string {
    if (!element.parentElement) return 'none'

    const parent = element.parentElement
    let info = parent.tagName.toLowerCase()

    if (parent.id) {
      info += `#${parent.id}`
    } else if (parent.className && typeof parent.className === 'string') {
      const classes = parent.className
        .trim()
        .split(/\s+/)
        .filter(c => c.length > 0)
      if (classes.length > 0) {
        info += `.${classes[0]}`
      }
    }

    return info
  }

  private navigateToNextElement(direction: string): void {
    if (!this.currentHighlightedElement) return

    const current = this.currentHighlightedElement
    let next: HTMLElement | null = null

    switch (direction) {
      case 'ArrowUp':
        next = this.findElementInDirection(current, 'up')
        break
      case 'ArrowDown':
        next = this.findElementInDirection(current, 'down')
        break
      case 'ArrowLeft':
        next = this.findElementInDirection(current, 'left')
        break
      case 'ArrowRight':
        next = this.findElementInDirection(current, 'right')
        break
    }

    if (next && !this.shouldIgnoreElement(next)) {
      this.highlightElement(next)
      this.scrollElementIntoView(next)
    }
  }

  private findElementInDirection(
    current: HTMLElement,
    direction: 'up' | 'down' | 'left' | 'right'
  ): HTMLElement | null {
    const rect = current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Get all selectable elements
    const allElements = Array.from(document.querySelectorAll('*')).filter(
      el => el instanceof HTMLElement && !this.shouldIgnoreElement(el)
    ) as HTMLElement[]

    let bestElement: HTMLElement | null = null
    let bestDistance = Infinity

    for (const element of allElements) {
      if (element === current) continue

      const elementRect = element.getBoundingClientRect()
      const elementCenterX = elementRect.left + elementRect.width / 2
      const elementCenterY = elementRect.top + elementRect.height / 2

      let isInDirection = false
      let distance = 0

      switch (direction) {
        case 'up':
          isInDirection = elementCenterY < centerY
          distance =
            Math.abs(elementCenterX - centerX) + (centerY - elementCenterY)
          break
        case 'down':
          isInDirection = elementCenterY > centerY
          distance =
            Math.abs(elementCenterX - centerX) + (elementCenterY - centerY)
          break
        case 'left':
          isInDirection = elementCenterX < centerX
          distance =
            Math.abs(elementCenterY - centerY) + (centerX - elementCenterX)
          break
        case 'right':
          isInDirection = elementCenterX > centerX
          distance =
            Math.abs(elementCenterY - centerY) + (elementCenterX - centerX)
          break
      }

      if (isInDirection && distance < bestDistance) {
        bestDistance = distance
        bestElement = element
      }
    }

    return bestElement
  }

  private scrollElementIntoView(element: HTMLElement): void {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    })
  }

  private showKeyboardHelp(): void {
    const helpMessage = `
Keyboard shortcuts for element selection:
• Escape: Cancel selection
• Enter: Select highlighted element
• Arrow keys: Navigate between elements
• Tab: Focus cancel button
• Ctrl+H: Show this help
    `

    // Create a temporary help popup
    const helpPopup = document.createElement('div')
    helpPopup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #333;
      color: white;
      padding: 20px;
      border-radius: 8px;
      z-index: 10002;
      font-family: monospace;
      font-size: 14px;
      line-height: 1.4;
      white-space: pre-line;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      max-width: 400px;
    `
    helpPopup.textContent = helpMessage

    document.body.appendChild(helpPopup)

    // Remove help popup after 3 seconds
    setTimeout(() => {
      if (helpPopup.parentNode) {
        helpPopup.parentNode.removeChild(helpPopup)
      }
    }, 3000)
  }

  private addSelectionStyles(): void {
    if (document.getElementById('backchannel-selection-styles')) return

    const styleElement = document.createElement('style')
    styleElement.id = 'backchannel-selection-styles'
    styleElement.textContent = `
      .backchannel-highlight {
        outline: 2px solid #007acc !important;
        outline-offset: 2px !important;
        background-color: rgba(0, 122, 204, 0.1) !important;
        cursor: crosshair !important;
        position: relative !important;
        transition: all 0.15s ease !important;
      }
      
      .backchannel-highlight:hover {
        outline-color: #0056b3 !important;
        background-color: rgba(0, 86, 179, 0.15) !important;
      }
      
      .backchannel-highlight::before {
        content: "Click to select";
        position: absolute;
        top: -28px;
        left: 50%;
        transform: translateX(-50%);
        background: #007acc;
        color: white;
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 500;
        border-radius: 3px;
        pointer-events: none;
        z-index: 10000;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        opacity: 0;
        animation: fadeIn 0.2s ease forwards;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(-5px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      
      /* Handle tooltip positioning for elements near screen edges */
      .backchannel-highlight.tooltip-bottom::before {
        top: auto;
        bottom: -28px;
      }
      
      .backchannel-highlight.tooltip-left::before {
        left: 0;
        transform: translateX(0);
      }
      
      .backchannel-highlight.tooltip-right::before {
        left: auto;
        right: 0;
        transform: translateX(0);
      }
      
      /* Responsive adjustments */
      @media (max-width: 768px) {
        .backchannel-highlight::before {
          font-size: 10px;
          padding: 3px 6px;
        }
      }
      
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .backchannel-highlight {
          outline-width: 3px !important;
          background-color: rgba(0, 122, 204, 0.2) !important;
        }
      }
      
      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .backchannel-highlight {
          transition: none !important;
        }
        
        .backchannel-highlight::before {
          animation: none !important;
          opacity: 1 !important;
        }
      }
    `

    document.head.appendChild(styleElement)
  }

  private removeSelectionStyles(): void {
    const styleElement = document.getElementById('backchannel-selection-styles')
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement)
    }
  }

  private addElementVisualFeedback(
    comment: CaptureComment,
    elementInfo: ReturnType<typeof this.getElementInfo>
  ): void {
    // Safety check for elementInfo
    if (!elementInfo || !elementInfo.xpath) {
      console.warn('Invalid element info for visual feedback:', elementInfo)
      return
    }

    // Find the element by XPath
    const element = this.findElementByXPath(elementInfo.xpath)
    if (!element) {
      console.warn(
        'Could not find element for visual feedback:',
        elementInfo.xpath
      )
      return
    }

    // Add background shading
    this.addElementBackgroundShading(element)

    // Add comment badge
    this.addCommentBadge(element, comment)

    // Ensure comment visual styles are loaded
    this.addCommentVisualStyles()
  }

  private findElementByXPath(xpath: string): HTMLElement | null {
    try {
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      )
      return result.singleNodeValue as HTMLElement
    } catch (error) {
      console.warn('Error finding element by XPath:', error)
      return null
    }
  }

  private addElementBackgroundShading(element: HTMLElement): void {
    // Add a class for subtle background shading
    element.classList.add('backchannel-commented')

    // Store the original background color if needed for restoration
    if (!element.dataset.originalBackground) {
      const computedStyle = window.getComputedStyle(element)
      element.dataset.originalBackground = computedStyle.backgroundColor
    }
  }

  private addCommentBadge(
    element: HTMLElement,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _comment: CaptureComment
  ): void {
    // Check if element already has a badge
    const existingBadge = element.querySelector('.backchannel-comment-badge')
    if (existingBadge) {
      // Update badge count
      const countElement = existingBadge.querySelector('.badge-count')
      if (countElement) {
        const currentCount = parseInt(countElement.textContent || '1', 10)
        countElement.textContent = (currentCount + 1).toString()
      }
      return
    }

    // Create new badge
    const badge = document.createElement('div')
    badge.className = 'backchannel-comment-badge'
    badge.innerHTML = `
      <span class="badge-icon">💬</span>
      <span class="badge-count">1</span>
    `

    // Add click handler to show comment details
    badge.addEventListener('click', event => {
      event.stopPropagation()
      this.showCommentDetails(element)
    })

    // Position badge relative to element
    element.style.position = 'relative'
    element.appendChild(badge)
  }

  private async showCommentDetails(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _element: HTMLElement
  ): Promise<void> {
    // Get all comments for this element
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _dbService = await this.getDatabaseService()
    // const allComments = await dbService.getComments();
    // const _elementComments = allComments.filter(
    //   c => c.location === this.getXPath(element)
    // );

    // Show sidebar with this element's comments highlighted
    if (this.sidebar) {
      this.sidebar.show()
      // TODO: Add method to highlight specific comments in sidebar
    }
  }

  private addCommentVisualStyles(): void {
    // Check if styles are already injected
    if (document.getElementById('backchannel-comment-styles')) {
      return
    }

    const styleElement = document.createElement('style')
    styleElement.id = 'backchannel-comment-styles'
    styleElement.textContent = `
      /* Commented element background shading */
      .backchannel-commented {
        background-color: rgba(0, 122, 204, 0.03) !important;
        border-left: 3px solid rgba(0, 122, 204, 0.3) !important;
        transition: background-color 0.2s ease !important;
      }
      
      .backchannel-commented:hover {
        background-color: rgba(0, 122, 204, 0.06) !important;
      }
      
      /* Comment badge styles */
      .backchannel-comment-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #007acc;
        color: white;
        border-radius: 12px;
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 2px;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease;
        user-select: none;
        min-width: 24px;
        justify-content: center;
      }
      
      .backchannel-comment-badge:hover {
        background: #0056b3;
        transform: scale(1.1);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
      }
      
      .backchannel-comment-badge .badge-icon {
        font-size: 10px;
      }
      
      .backchannel-comment-badge .badge-count {
        font-size: 10px;
        font-weight: 600;
        min-width: 12px;
        text-align: center;
      }
      
      /* Handle positioning for different element types */
      .backchannel-commented {
        position: relative;
      }
      
      /* Ensure badges don't interfere with content */
      .backchannel-comment-badge {
        pointer-events: auto;
      }
      
      /* Responsive adjustments */
      @media (max-width: 768px) {
        .backchannel-comment-badge {
          top: -6px;
          right: -6px;
          padding: 3px 6px;
          font-size: 10px;
        }
      }
      
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .backchannel-commented {
          background-color: rgba(0, 122, 204, 0.1) !important;
          border-left-width: 4px !important;
        }
        
        .backchannel-comment-badge {
          background: #004d7a;
          border: 1px solid #ffffff;
        }
      }
      
      /* Print styles - hide badges and shading */
      @media print {
        .backchannel-comment-badge {
          display: none !important;
        }
        
        .backchannel-commented {
          background-color: transparent !important;
          border-left: none !important;
        }
      }
    `

    document.head.appendChild(styleElement)
  }

  private removeCommentVisualStyles(): void {
    const styleElement = document.getElementById('backchannel-comment-styles')
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement)
    }
  }

  private async loadExistingComments(): Promise<void> {
    try {
      const dbService = await this.getDatabaseService()
      const allComments = await dbService.getComments()
      const currentPageComments = allComments.filter(
        comment => comment.pageUrl === window.location.href
      )

      // Apply visual feedback for existing comments
      for (const comment of currentPageComments) {
        const element = this.findElementByXPath(comment.location)
        if (element) {
          this.addElementBackgroundShading(element)
          this.addCommentBadge(element, comment)
        } else {
          console.warn(
            'Could not find element for existing comment:',
            comment.location
          )
        }
      }

      // Ensure comment visual styles are loaded
      if (currentPageComments.length > 0) {
        this.addCommentVisualStyles()
      }
    } catch (error) {
      console.error('Failed to load existing comments:', error)
    }
  }

  private async checkMetadataOrCreatePackage(): Promise<void> {
    try {
      const db = await this.getDatabaseService()
      const metadata = await db.getMetadata()

      if (metadata) {
        // Metadata exists, activate capture mode
        this.setState(FeedbackState.CAPTURE)
      } else {
        // No metadata, show package creation modal
        if (this.icon && typeof this.icon.openPackageModal === 'function') {
          this.icon.openPackageModal()
        } else {
          console.warn('Package modal not available')
        }
      }
    } catch (error) {
      console.error('Error checking metadata:', error)
      // Fallback to opening modal on error
      if (this.icon && typeof this.icon.openPackageModal === 'function') {
        this.icon.openPackageModal()
      } else {
        console.warn('Package modal not available')
      }
    }
  }

  private setState(newState: FeedbackState): void {
    this.state = newState

    if (this.icon) {
      // Handle both Lit component and fallback icon
      if (typeof this.icon.setState === 'function') {
        this.icon.setState(newState)
      } else {
        // Fallback: set attribute directly
        this.icon.setAttribute('state', newState)
      }
    }
  }

  getState(): FeedbackState {
    return this.state
  }

  getConfig(): PluginConfig {
    return { ...this.config }
  }

  /**
   * Enable BackChannel after successful package creation
   */
  async enableBackChannel(): Promise<void> {
    try {
      this.isEnabled = true
      const db = await this.getDatabaseService()
      db.clearEnabledStateCache()

      // Initialize sidebar if not already created
      if (!this.sidebar) {
        await this.initializeSidebar()
      }

      // Update icon enabled state and set state to capture
      this.setState(FeedbackState.CAPTURE)
      if (this.icon) {
        if (typeof this.icon.setEnabled === 'function') {
          this.icon.setEnabled(true)
        } else {
          // Fallback: set attribute directly
          this.icon.setAttribute('enabled', 'true')
        }
      }

      // Show sidebar after package creation
      if (this.sidebar) {
        this.sidebar.show()
        this.updateIconVisibility()
      }
    } catch (error) {
      console.error('Error enabling BackChannel:', error)
    }
  }
}

const backChannelInstance = new BackChannelPlugin()

if (typeof window !== 'undefined') {
  window.BackChannel = {
    init: (config?: PluginConfig) => backChannelInstance.init(config),
    getState: () => backChannelInstance.getState(),
    getConfig: () => backChannelInstance.getConfig(),
    enableBackChannel:
      backChannelInstance.enableBackChannel.bind(backChannelInstance),
    getDatabaseService:
      backChannelInstance.getDatabaseService.bind(backChannelInstance),
    get isEnabled() {
      return backChannelInstance['isEnabled']
    },
  }

  // Auto-initialize with default configuration when window loads
  window.addEventListener('load', () => {
    backChannelInstance.init().catch(error => {
      console.error('BackChannel auto-initialization failed:', error)
    })
  })
}

export default backChannelInstance
