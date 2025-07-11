/**
 * Global type definitions for BackChannel
 */

import { BackChannelConfig } from '../index'

declare global {
  interface Window {
    BackChannel: {
      init: (config?: BackChannelConfig) => BackChannel
    }
  }
}

export {}
