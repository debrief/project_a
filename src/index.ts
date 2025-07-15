import { PluginConfig, FeedbackState } from './types';
import { DatabaseService } from './services/DatabaseService';
import { seedDemoDatabaseIfNeeded } from './utils/seedDemoDatabase';
import { BackChannelIcon } from './components/BackChannelIcon';

class BackChannelPlugin {
  private config: PluginConfig;
  private state: FeedbackState;
  private databaseService: DatabaseService;
  private icon: BackChannelIcon | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.config = this.getDefaultConfig();
    this.state = FeedbackState.INACTIVE;
    this.databaseService = new DatabaseService();
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

  async init(config: PluginConfig = {}): Promise<void> {
    this.config = {
      ...this.getDefaultConfig(),
      ...config,
    };

    try {
      // Initialize database service
      await this.databaseService.initialize();

      // Seed demo database if needed
      await seedDemoDatabaseIfNeeded();

      // Determine if BackChannel should be enabled for this page
      this.isEnabled = await this.databaseService.isBackChannelEnabled();

      this.setupEventListeners();

      if (this.config.debugMode) {
        console.log('BackChannel plugin initialized with config:', this.config);
        console.log('BackChannel enabled for this page:', this.isEnabled);
      } else {
        console.log('BackChannel plugin initialized');
        console.log('BackChannel enabled for this page:', this.isEnabled);
      }
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
    console.log('BackChannel DOM ready');
    // Initialize UI components after DOM is ready
    await this.initializeUI();
  }

  private async initializeUI(): Promise<void> {
    try {
      // Try to create the Lit component
      const iconElement = document.createElement('backchannel-icon');

      // Check if it's a proper custom element by checking for connectedCallback
      if (iconElement.connectedCallback) {
        console.log('Lit component available, using it');

        // Cast to the proper type
        this.icon = iconElement as BackChannelIcon;

        // Set properties directly
        this.icon.databaseService = this.databaseService;
        this.icon.state = this.state;
        this.icon.enabled = this.isEnabled;

        // Add to DOM
        document.body.appendChild(this.icon);

        // Wait for the component to be ready
        await this.icon.updateComplete;

        // Set click handler
        if (typeof this.icon.setClickHandler === 'function') {
          this.icon.setClickHandler(() => this.handleIconClick());
        } else {
          this.icon.addEventListener('click', () => this.handleIconClick());
        }

        console.log('Lit component initialized successfully');
      } else {
        throw new Error('Lit component not properly registered');
      }
    } catch (error) {
      console.error('Failed to initialize Lit component:', error);
      console.log('Falling back to basic icon implementation');
      this.initializeFallbackIcon();
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
    console.log('Fallback icon created');
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
    console.log(
      'BackChannel icon clicked, current state:',
      this.state,
      'enabled:',
      this.isEnabled
    );

    // If not enabled, always show package creation modal
    if (!this.isEnabled) {
      console.log('BackChannel not enabled, opening package creation modal');
      if (this.icon && typeof this.icon.openPackageModal === 'function') {
        this.icon.openPackageModal();
      } else {
        console.warn('Package modal not available');
      }
      return;
    }

    // If enabled, handle normal state transitions
    switch (this.state) {
      case FeedbackState.INACTIVE:
        this.setState(FeedbackState.CAPTURE);
        break;
      case FeedbackState.CAPTURE:
        this.setState(FeedbackState.REVIEW);
        break;
      case FeedbackState.REVIEW:
        this.setState(FeedbackState.INACTIVE);
        break;
    }
  }

  private async checkMetadataOrCreatePackage(): Promise<void> {
    try {
      const metadata = await this.databaseService.getMetadata();

      if (metadata) {
        // Metadata exists, activate capture mode
        console.log('Existing metadata found:', metadata);
        this.setState(FeedbackState.CAPTURE);
      } else {
        // No metadata, show package creation modal
        console.log('No metadata found, opening package creation modal');
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

    console.log('BackChannel state changed to:', newState);
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
      this.databaseService.clearEnabledStateCache();

      // Update icon enabled state
      if (this.icon) {
        if (typeof this.icon.setEnabled === 'function') {
          this.icon.setEnabled(true);
        } else {
          // Fallback: set attribute directly
          this.icon.setAttribute('enabled', 'true');
        }
      }

      console.log('BackChannel enabled after package creation');
    } catch (error) {
      console.error('Error enabling BackChannel:', error);
    }
  }
}

const backChannelInstance = new BackChannelPlugin();

declare global {
  interface Window {
    BackChannel: {
      init: (config?: PluginConfig) => Promise<void>;
      getState: () => FeedbackState;
      getConfig: () => PluginConfig;
      enableBackChannel: () => Promise<void>;
    };
  }
}

if (typeof window !== 'undefined') {
  window.BackChannel = {
    init: (config?: PluginConfig) => backChannelInstance.init(config),
    getState: () => backChannelInstance.getState(),
    getConfig: () => backChannelInstance.getConfig(),
    enableBackChannel: () => backChannelInstance.enableBackChannel(),
  };

  // Auto-initialize with default configuration when window loads
  window.addEventListener('load', () => {
    backChannelInstance.init().catch(error => {
      console.error('BackChannel auto-initialization failed:', error);
    });
  });
}

export default backChannelInstance;
