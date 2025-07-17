import {
  PluginConfig,
  FeedbackState,
  FakeDbStore,
  IBackChannelPlugin,
  BackChannelIconAPI,
} from './types';
import { DatabaseService } from './services/DatabaseService';
import { seedDemoDatabaseIfNeeded } from './utils/seedDemoDatabase';
import { BackChannelIcon } from './components/BackChannelIcon';
import { BackChannelSidebar } from './components/BackChannelSidebar';

declare global {
  interface Window {
    BackChannel: {
      init: (config?: PluginConfig) => Promise<void>;
      getState: () => FeedbackState;
      getConfig: () => PluginConfig;
      enableBackChannel: () => Promise<void>;
      getDatabaseService: () => Promise<DatabaseService>;
      isEnabled: boolean;
    };
    BackChannelIcon: typeof BackChannelIcon;
    BackChannelSidebar: typeof BackChannelSidebar;
  }
}
// Force the custom element to be registered
if (typeof window !== 'undefined') {
  // Simply referencing the class ensures it's not tree-shaken
  window.BackChannelIcon = BackChannelIcon;
  window.BackChannelSidebar = BackChannelSidebar;
}

class BackChannelPlugin implements IBackChannelPlugin {
  private config: PluginConfig;
  private state: FeedbackState;
  private databaseService: DatabaseService | null = null;
  private icon: BackChannelIcon | null = null;
  private sidebar: BackChannelSidebar | null = null;
  private isEnabled: boolean = false;
  private isSelectingElement: boolean = false;
  private selectionCancelButton: HTMLElement | null = null;
  private currentHighlightedElement: HTMLElement | null = null;

  constructor() {
    this.config = this.getDefaultConfig();
    this.state = FeedbackState.INACTIVE;
  }

  /**
   * Lazily creates and initializes the DatabaseService instance.
   */
  public async getDatabaseService(): Promise<DatabaseService> {
    if (this.databaseService) {
      return this.databaseService;
    }

    let dbService: DatabaseService;

    // Check if fakeData is available with database configuration
    if (typeof window !== 'undefined') {
      const fakeData = (window as unknown as { fakeData?: FakeDbStore })
        .fakeData;
      if (fakeData && fakeData.databases && fakeData.databases.length > 0) {
        const firstDb = fakeData.databases[0];
        dbService = new DatabaseService(
          undefined,
          firstDb.name,
          firstDb.version
        );
      } else {
        // Use default configuration
        dbService = new DatabaseService();
      }
    } else {
      // Fallback for non-browser environments
      dbService = new DatabaseService();
    }

    // Seed demo database if needed (BEFORE opening database)
    await seedDemoDatabaseIfNeeded();

    // Initialize the service (this opens the database)
    await dbService.initialize();

    this.databaseService = dbService;
    return this.databaseService;
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
    };
  }

  /**
   * Generate a storage key based on the current document URL
   */
  private generateStorageKey(): string {
    if (typeof window !== 'undefined' && window.location) {
      const url = new URL(window.location.href);
      return `backchannel-${url.hostname}${url.pathname}`;
    }
    return 'backchannel-feedback';
  }

  /**
   * Clear BackChannel-related localStorage entries
   * Called when no feedback package exists for the current page
   */
  private clearBackChannelLocalStorage(): void {
    try {
      const keysToRemove = [
        'backchannel-db-id',
        'backchannel-url-root',
        'backchannel-enabled-state',
        'backchannel-last-url-check',
        'backchannel-seed-version',
      ];

      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('Failed to clear BackChannel localStorage:', error);
    }
  }

  async init(config: PluginConfig = {}): Promise<void> {
    this.config = {
      ...this.getDefaultConfig(),
      ...config,
    };

    try {
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize BackChannel plugin:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.onDOMReady().catch(error => {
          console.error('Failed to initialize UI after DOM ready:', error);
        });
      });
    } else {
      this.onDOMReady().catch(error => {
        console.error('Failed to initialize UI:', error);
      });
    }
  }

  private async onDOMReady(): Promise<void> {
    // Check if BackChannel should be enabled for this page using static method
    // This doesn't create a database connection unless there's an existing feedback package
    try {
      const hasExistingPackage =
        await DatabaseService.hasExistingFeedbackPackage();

      if (hasExistingPackage) {
        // Only create database service if there's an existing package
        const db = await this.getDatabaseService();
        this.isEnabled = await db.isBackChannelEnabled();
      } else {
        // No existing package, remain disabled and clear any localStorage
        this.isEnabled = false;
        this.clearBackChannelLocalStorage();
      }
    } catch (error) {
      console.error('Failed to check if BackChannel should be enabled:', error);
      // Keep isEnabled as false on error
      this.isEnabled = false;
    }

    // Initialize UI components after DOM is ready
    await this.initializeUI();
  }

  private async initializeUI(): Promise<void> {
    try {
      // Try to create the Lit component
      const iconElement = document.createElement('backchannel-icon');

      // Check if it's a proper custom element by checking for connectedCallback
      if (
        (iconElement as unknown as { connectedCallback: () => void })
          .connectedCallback
      ) {
        // Cast to the proper type
        this.icon = iconElement as BackChannelIcon;

        // Set properties directly
        this.icon.backChannelPlugin = this;
        this.icon.state = this.state;
        this.icon.enabled = this.isEnabled;

        // Add to DOM
        document.body.appendChild(this.icon);

        // Initialize sidebar if enabled
        if (this.isEnabled) {
          await this.initializeSidebar();
        }

        // Inject styles for the icon and other components
        this.injectStyles();

        // Wait for the component to be ready
        await this.icon.updateComplete;

        // Set click handler
        (this.icon as BackChannelIconAPI).setClickHandler(() =>
          this.handleIconClick()
        );
      } else {
        throw new Error('Lit component not properly registered');
      }
    } catch (error) {
      console.error('Failed to initialize Lit component:', error);
      this.initializeFallbackIcon();
    }
  }

  private async initializeSidebar(): Promise<void> {
    try {
      // Create sidebar element
      const sidebarElement = document.createElement('backchannel-sidebar');

      // Check if it's a proper custom element
      if (
        (sidebarElement as unknown as { connectedCallback: () => void })
          .connectedCallback
      ) {
        // Cast to the proper type
        this.sidebar = sidebarElement as BackChannelSidebar;

        // Set properties
        this.sidebar.backChannelPlugin = this;

        // Let the sidebar component handle its own visibility state restoration
        // This ensures the 'visible' attribute is properly set on the DOM element

        // Add event listeners for sidebar events
        this.sidebar.addEventListener('sidebar-closed', () => {
          this.handleSidebarClosed();
        });

        this.sidebar.addEventListener('start-capture', () => {
          this.handleStartCapture();
        });

        this.sidebar.addEventListener('export-comments', () => {
          this.handleExportComments();
        });

        // Add to DOM
        document.body.appendChild(this.sidebar);

        // Update icon visibility based on sidebar state
        this.updateIconVisibility();

        // Wait for the component to be ready
        await this.sidebar.updateComplete;
      } else {
        throw new Error('Sidebar Lit component not properly registered');
      }
    } catch (error) {
      console.error('Failed to initialize sidebar:', error);
    }
  }

  private initializeFallbackIcon(): void {
    // Create a basic icon element if Lit component fails
    const icon = document.createElement('div');
    icon.id = 'backchannel-icon';
    icon.setAttribute('state', this.state);
    icon.setAttribute('enabled', this.isEnabled.toString());
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
    `;
    icon.innerHTML = '💬';
    icon.addEventListener('click', () => this.handleIconClick());
    document.body.appendChild(icon);
  }

  private injectStyles(): void {
    // Check if styles are already injected
    if (document.getElementById('backchannel-styles')) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'backchannel-styles';
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
    `;

    document.head.appendChild(styleElement);
  }

  private handleIconClick(): void {
    // If not enabled, always show package creation modal
    if (!this.isEnabled) {
      if (this.icon && typeof this.icon.openPackageModal === 'function') {
        this.icon.openPackageModal();
      } else {
        console.warn('Package modal not available');
      }
      return;
    }

    // If enabled, show sidebar (transition from Active to Capture mode)
    if (this.sidebar) {
      this.sidebar.show();
      this.updateIconVisibility();
    } else {
      console.warn('Sidebar not available');
    }
  }

  private handleSidebarClosed(): void {
    // Update icon visibility when sidebar is closed (transition from Capture to Active mode)
    this.updateIconVisibility();
  }

  private handleStartCapture(): void {
    // Hide sidebar temporarily for element selection
    if (this.sidebar) {
      this.sidebar.hide();
    }

    console.log('Starting element selection...');
    this.enableElementSelection();
  }

  private handleExportComments(): void {
    // TODO: Implement CSV export logic
    console.log('Exporting comments to CSV...');
  }

  private updateIconVisibility(): void {
    if (!this.icon) return;

    // Hide icon when sidebar is visible (Capture mode)
    // Show icon when sidebar is hidden (Active mode)
    const sidebarVisible = this.sidebar?.visible || false;

    if (sidebarVisible) {
      this.icon.style.display = 'none';
    } else {
      this.icon.style.display = 'flex';
    }
  }

  private enableElementSelection(): void {
    if (this.isSelectingElement) return;

    this.isSelectingElement = true;
    this.createCancelButton();
    this.addSelectionEventListeners();
    this.addSelectionStyles();

    // Change cursor to indicate selection mode
    document.body.style.cursor = 'crosshair';
  }

  private disableElementSelection(): void {
    if (!this.isSelectingElement) return;

    this.isSelectingElement = false;
    this.removeCancelButton();
    this.removeSelectionEventListeners();
    this.removeSelectionStyles();
    this.clearHighlight();

    // Restore normal cursor
    document.body.style.cursor = '';

    // Show sidebar again
    if (this.sidebar) {
      this.sidebar.show();
    }
  }

  private createCancelButton(): void {
    if (this.selectionCancelButton) return;

    this.selectionCancelButton = document.createElement('button');
    this.selectionCancelButton.id = 'backchannel-cancel-selection';
    this.selectionCancelButton.textContent = 'Cancel selection';
    this.selectionCancelButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      z-index: 10001;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      transition: all 0.2s ease;
    `;

    this.selectionCancelButton.addEventListener('mouseenter', () => {
      if (this.selectionCancelButton) {
        this.selectionCancelButton.style.background = '#c82333';
        this.selectionCancelButton.style.transform = 'translateY(-1px)';
      }
    });

    this.selectionCancelButton.addEventListener('mouseleave', () => {
      if (this.selectionCancelButton) {
        this.selectionCancelButton.style.background = '#dc3545';
        this.selectionCancelButton.style.transform = 'translateY(0)';
      }
    });

    this.selectionCancelButton.addEventListener('click', () => {
      console.log('Element selection cancelled');
      this.disableElementSelection();
    });

    document.body.appendChild(this.selectionCancelButton);
  }

  private removeCancelButton(): void {
    if (this.selectionCancelButton && this.selectionCancelButton.parentNode) {
      this.selectionCancelButton.parentNode.removeChild(
        this.selectionCancelButton
      );
      this.selectionCancelButton = null;
    }
  }

  private addSelectionEventListeners(): void {
    document.addEventListener('mouseover', this.handleElementHover);
    document.addEventListener('mouseout', this.handleElementLeave);
    document.addEventListener('click', this.handleElementClick);
    document.addEventListener('keydown', this.handleSelectionKeydown);
  }

  private removeSelectionEventListeners(): void {
    document.removeEventListener('mouseover', this.handleElementHover);
    document.removeEventListener('mouseout', this.handleElementLeave);
    document.removeEventListener('click', this.handleElementClick);
    document.removeEventListener('keydown', this.handleSelectionKeydown);
  }

  private handleElementHover = (event: MouseEvent): void => {
    if (!this.isSelectingElement) return;

    const target = event.target as HTMLElement;
    if (this.shouldIgnoreElement(target)) return;

    this.highlightElement(target);
  };

  private handleElementLeave = (event: MouseEvent): void => {
    if (!this.isSelectingElement) return;

    const target = event.target as HTMLElement;
    if (this.shouldIgnoreElement(target)) return;

    this.clearHighlight();
  };

  private handleElementClick = (event: MouseEvent): void => {
    if (!this.isSelectingElement) return;

    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement;
    if (this.shouldIgnoreElement(target)) return;

    this.selectElement(target);
  };

  private handleSelectionKeydown = (event: KeyboardEvent): void => {
    if (!this.isSelectingElement) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      console.log('Element selection cancelled (Escape key)');
      this.disableElementSelection();
    }
  };

  private shouldIgnoreElement(element: HTMLElement): boolean {
    // Ignore BackChannel elements
    if (
      element.id === 'backchannel-cancel-selection' ||
      element.tagName === 'BACKCHANNEL-ICON' ||
      element.tagName === 'BACKCHANNEL-SIDEBAR'
    ) {
      return true;
    }

    // Ignore elements that are children of BackChannel components
    if (
      element.closest('backchannel-icon') ||
      element.closest('backchannel-sidebar') ||
      element.closest('#backchannel-cancel-selection')
    ) {
      return true;
    }

    return false;
  }

  private highlightElement(element: HTMLElement): void {
    this.clearHighlight();
    this.currentHighlightedElement = element;
    element.classList.add('backchannel-highlight');
  }

  private clearHighlight(): void {
    if (this.currentHighlightedElement) {
      this.currentHighlightedElement.classList.remove('backchannel-highlight');
      this.currentHighlightedElement = null;
    }
  }

  private selectElement(element: HTMLElement): void {
    const elementInfo = this.getElementInfo(element);

    console.log('Selected element details:', elementInfo);

    // For now, just log the selection and return to sidebar
    // In a complete implementation, this would open a comment creation dialog

    this.disableElementSelection();
  }

  private getElementInfo(element: HTMLElement): {
    tagName: string;
    xpath: string;
    textContent: string;
    attributes: Record<string, string>;
    boundingRect: DOMRect;
  } {
    return {
      tagName: element.tagName.toLowerCase(),
      xpath: this.getXPath(element),
      textContent: element.textContent?.trim() || '',
      attributes: this.getElementAttributes(element),
      boundingRect: element.getBoundingClientRect(),
    };
  }

  private getXPath(element: HTMLElement): string {
    const parts: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      const siblings = current.parentNode?.children || [];

      for (let i = 0; i < siblings.length; i++) {
        if (siblings[i] === current) {
          index = i + 1;
          break;
        }
      }

      const tagName = current.tagName.toLowerCase();
      const part = index > 1 ? `${tagName}[${index}]` : tagName;
      parts.unshift(part);

      current = current.parentElement;
    }

    return '/' + parts.join('/');
  }

  private getElementAttributes(element: HTMLElement): Record<string, string> {
    const attributes: Record<string, string> = {};

    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attributes[attr.name] = attr.value;
    }

    return attributes;
  }

  private addSelectionStyles(): void {
    if (document.getElementById('backchannel-selection-styles')) return;

    const styleElement = document.createElement('style');
    styleElement.id = 'backchannel-selection-styles';
    styleElement.textContent = `
      .backchannel-highlight {
        outline: 2px solid #007acc !important;
        outline-offset: 2px !important;
        background-color: rgba(0, 122, 204, 0.1) !important;
        cursor: crosshair !important;
      }
      
      .backchannel-highlight::before {
        content: "Click to select";
        position: absolute;
        top: -25px;
        left: 0;
        background: #007acc;
        color: white;
        padding: 2px 6px;
        font-size: 12px;
        border-radius: 2px;
        pointer-events: none;
        z-index: 10000;
      }
    `;

    document.head.appendChild(styleElement);
  }

  private removeSelectionStyles(): void {
    const styleElement = document.getElementById(
      'backchannel-selection-styles'
    );
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }
  }

  private async checkMetadataOrCreatePackage(): Promise<void> {
    try {
      const db = await this.getDatabaseService();
      const metadata = await db.getMetadata();

      if (metadata) {
        // Metadata exists, activate capture mode
        this.setState(FeedbackState.CAPTURE);
      } else {
        // No metadata, show package creation modal
        if (this.icon && typeof this.icon.openPackageModal === 'function') {
          this.icon.openPackageModal();
        } else {
          console.warn('Package modal not available');
        }
      }
    } catch (error) {
      console.error('Error checking metadata:', error);
      // Fallback to opening modal on error
      if (this.icon && typeof this.icon.openPackageModal === 'function') {
        this.icon.openPackageModal();
      } else {
        console.warn('Package modal not available');
      }
    }
  }

  private setState(newState: FeedbackState): void {
    this.state = newState;

    if (this.icon) {
      // Handle both Lit component and fallback icon
      if (typeof this.icon.setState === 'function') {
        this.icon.setState(newState);
      } else {
        // Fallback: set attribute directly
        this.icon.setAttribute('state', newState);
      }
    }
  }

  getState(): FeedbackState {
    return this.state;
  }

  getConfig(): PluginConfig {
    return { ...this.config };
  }

  /**
   * Enable BackChannel after successful package creation
   */
  async enableBackChannel(): Promise<void> {
    try {
      this.isEnabled = true;
      const db = await this.getDatabaseService();
      db.clearEnabledStateCache();

      // Initialize sidebar if not already created
      if (!this.sidebar) {
        await this.initializeSidebar();
      }

      // Update icon enabled state and set state to capture
      this.setState(FeedbackState.CAPTURE);
      if (this.icon) {
        if (typeof this.icon.setEnabled === 'function') {
          this.icon.setEnabled(true);
        } else {
          // Fallback: set attribute directly
          this.icon.setAttribute('enabled', 'true');
        }
      }

      // Show sidebar after package creation
      if (this.sidebar) {
        this.sidebar.show();
        this.updateIconVisibility();
      }
    } catch (error) {
      console.error('Error enabling BackChannel:', error);
    }
  }
}

const backChannelInstance = new BackChannelPlugin();

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
      return backChannelInstance['isEnabled'];
    },
  };

  // Auto-initialize with default configuration when window loads
  window.addEventListener('load', () => {
    backChannelInstance.init().catch(error => {
      console.error('BackChannel auto-initialization failed:', error);
    });
  });
}

export default backChannelInstance;
