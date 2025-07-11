/**
 * BackChannel Plugin
 * A lightweight JavaScript plugin for capturing and reviewing feedback on static web content
 */

// Import types
import { BackChannelConfig, PluginMode } from './types'

// Main class
class BackChannel {
  private config: BackChannelConfig

  constructor(config: BackChannelConfig = {}) {
    this.config = {
      targetSelector: '.reviewable',
      requireInitials: true,
      allowExport: true,
      storageKey: 'backchannel',
      initialMode: PluginMode.Capture,
      showIconOnLoad: true,
      iconPosition: 'top-right',
      ...config,
    }

    console.log('BackChannel initialized with config:', this.config)
  }

  public init(): void {
    window.addEventListener('load', () => {
      console.log('BackChannel plugin loaded')
      // Implementation will be added in future tasks
    })
  }
}

// Export as global and module
const instance = new BackChannel()

// Create global instance
if (typeof window !== 'undefined') {
  window.BackChannel = {
    init: (config: BackChannelConfig = {}) => {
      Object.assign(instance, new BackChannel(config))
      instance.init()
      return instance
    },
  }
}

export default instance
