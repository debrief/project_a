import { PluginConfig, FeedbackState } from './types';
import { DatabaseService } from './services/DatabaseService';
import { seedDemoDatabaseIfNeeded } from './utils/seedDemoDatabase';
import { BackChannelIcon } from './components/BackChannelIcon';

class BackChannelPlugin {
  private config: PluginConfig;
  private state: FeedbackState;
  private databaseService: DatabaseService;
  private icon: BackChannelIcon | null = null;

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

      this.setupEventListeners();

      if (this.config.debugMode) {
        console.log('BackChannel plugin initialized with config:', this.config);
      } else {
        console.log('BackChannel plugin initialized');
      }
    } catch (error) {
      console.error('Failed to initialize BackChannel plugin:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.onDOMReady();
      });
    } else {
      this.onDOMReady();
    }
  }

  private onDOMReady(): void {
    console.log('BackChannel DOM ready');
    // Initialize UI components after DOM is ready
    this.initializeUI();
  }

  private initializeUI(): void {
    // Inject CSS styles
    this.injectStyles();

    // Create and initialize the icon
    this.icon = new BackChannelIcon();
    this.icon.setState(this.state);
    this.icon.setClickHandler(() => this.handleIconClick());

    console.log('BackChannel UI initialized');
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
    console.log('BackChannel icon clicked, current state:', this.state);

    // Toggle between states for demonstration
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

  private setState(newState: FeedbackState): void {
    this.state = newState;

    if (this.icon) {
      this.icon.setState(newState);
    }

    console.log('BackChannel state changed to:', newState);
  }

  getState(): FeedbackState {
    return this.state;
  }

  getConfig(): PluginConfig {
    return { ...this.config };
  }
}

const backChannelInstance = new BackChannelPlugin();

declare global {
  interface Window {
    BackChannel: {
      init: (config?: PluginConfig) => Promise<void>;
      getState: () => FeedbackState;
      getConfig: () => PluginConfig;
    };
  }
}

if (typeof window !== 'undefined') {
  window.BackChannel = {
    init: (config?: PluginConfig) => backChannelInstance.init(config),
    getState: () => backChannelInstance.getState(),
    getConfig: () => backChannelInstance.getConfig(),
  };

  // Auto-initialize with default configuration when window loads
  window.addEventListener('load', () => {
    backChannelInstance.init().catch(error => {
      console.error('BackChannel auto-initialization failed:', error);
    });
  });
}

export default backChannelInstance;
