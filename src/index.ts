import { PluginConfig, FeedbackState } from './types';

class BackChannelPlugin {
  private config: PluginConfig;
  private state: FeedbackState;

  constructor() {
    this.config = {};
    this.state = FeedbackState.INACTIVE;
  }

  init(config: PluginConfig = {}): void {
    this.config = {
      requireInitials: false,
      storageKey: 'backchannel-feedback',
      targetSelector: '.reviewable',
      allowExport: true,
      ...config,
    };

    this.setupEventListeners();
    console.log('BackChannel plugin initialized');
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
}

export default backChannelInstance;
