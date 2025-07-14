/**
 * @fileoverview Unit tests for BackChannel Plugin (UI and Icon functionality)
 * @version 1.0.0
 * @author BackChannel Team
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BackChannelIcon } from '../../src/components/BackChannelIcon';
import { FeedbackState } from '../../src/types';

// Mock document
const mockDocument = {
  body: { appendChild: vi.fn() },
  head: { appendChild: vi.fn() },
  createElement: vi.fn(() => ({
    id: '',
    className: '',
    title: '',
    innerHTML: '',
    style: {},
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn()
    },
    setAttribute: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    parentNode: { removeChild: vi.fn() }
  })),
  getElementById: vi.fn(() => null),
  readyState: 'complete'
};

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
});

describe('BackChannelIcon', () => {
  let icon: BackChannelIcon;

  beforeEach(() => {
    vi.clearAllMocks();
    icon = new BackChannelIcon();
  });

  it('should create icon with inactive state', () => {
    expect(icon.getState()).toBe(FeedbackState.INACTIVE);
    expect(mockDocument.body.appendChild).toHaveBeenCalled();
  });

  it('should update state and appearance', () => {
    icon.setState(FeedbackState.CAPTURE);
    expect(icon.getState()).toBe(FeedbackState.CAPTURE);
    
    icon.setState(FeedbackState.REVIEW);
    expect(icon.getState()).toBe(FeedbackState.REVIEW);
    
    icon.setState(FeedbackState.INACTIVE);
    expect(icon.getState()).toBe(FeedbackState.INACTIVE);
  });

  it('should handle click events', () => {
    const clickHandler = vi.fn();
    icon.setClickHandler(clickHandler);
    
    // Test that the handler is set properly
    expect(clickHandler).toHaveBeenCalledTimes(0);
    
    // Since we're using a mock, we can't actually dispatch events
    // But we can verify the handler was set
    expect(icon.getElement().addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('should handle keyboard events', () => {
    const clickHandler = vi.fn();
    icon.setClickHandler(clickHandler);
    
    // Test that keyboard listener is set
    expect(icon.getElement().addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should clean up event listeners on destroy', () => {
    const element = icon.getElement();
    const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');
    
    icon.destroy();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});