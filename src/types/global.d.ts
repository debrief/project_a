/**
 * Global type definitions for BackChannel
 */

import { BackChannelConfig } from './index'
import BackChannel from '../index'

declare global {
  interface Window {
    BackChannel: {
      init: (config?: BackChannelConfig) => BackChannel
    }
  }
}

export {}
