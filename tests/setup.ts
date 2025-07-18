import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.clearAllMocks();
  
  // Clear any existing global BackChannel
  if (typeof globalThis !== 'undefined' && globalThis.window && globalThis.window.BackChannel) {
    delete globalThis.window.BackChannel;
  }
});