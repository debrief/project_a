import { PluginConfig, FeedbackState } from './types';

class BackChannelPlugin {
  private config: PluginConfig;
  private state: FeedbackState;

  constructor() {
    this.config = this.getDefaultConfig();
    this.state = FeedbackState.INACTIVE;
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

  init(config: PluginConfig = {}): void {
    this.config = {
      ...this.getDefaultConfig(),
      ...config,
    };

    this.setupEventListeners();

    if (this.config.debugMode) {
      console.log('BackChannel plugin initialized with config:', this.config);
    } else {
      console.log('BackChannel plugin initialized');
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
      init: (config?: PluginConfig) => void;
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

  // Auto-initialize with default configuration when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      backChannelInstance.init();
    });
  } else {
    backChannelInstance.init();
  }
}

export default backChannelInstance;
