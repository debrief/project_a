/**
 * @fileoverview BackChannel Icon Component
 * @version 1.0.0
 * @author BackChannel Team
 */

import { FeedbackState } from '../types';

/**
 * BackChannel Icon Component
 * Provides the main UI element for accessing BackChannel functionality
 */
export class BackChannelIcon {
  private element: HTMLElement;
  private state: FeedbackState;
  private clickHandler?: () => void;

  constructor() {
    this.state = FeedbackState.INACTIVE;
    this.element = this.createElement();
    this.attachToDOM();
  }

  /**
   * Create the icon element with SVG
   */
  private createElement(): HTMLElement {
    const iconContainer = document.createElement('div');
    iconContainer.id = 'backchannel-icon';
    iconContainer.className = 'backchannel-icon';
    iconContainer.title = 'BackChannel Feedback';
    iconContainer.setAttribute('role', 'button');
    iconContainer.setAttribute('tabindex', '0');

    // SVG icon for BackChannel
    iconContainer.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V16C2 17.1 2.9 18 4 18H6L10 22L14 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M8 8H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="18" cy="6" r="3" fill="currentColor" class="backchannel-icon-badge"/>
      </svg>
    `;

    return iconContainer;
  }

  /**
   * Attach the icon to the DOM
   */
  private attachToDOM(): void {
    document.body.appendChild(this.element);
  }

  /**
   * Set the icon state and update visual appearance
   */
  setState(state: FeedbackState): void {
    this.state = state;
    this.updateAppearance();
  }

  /**
   * Update the icon's visual appearance based on state
   */
  private updateAppearance(): void {
    const icon = this.element;

    // Remove existing state classes
    icon.classList.remove('inactive', 'capture', 'review');

    // Add current state class
    switch (this.state) {
      case FeedbackState.INACTIVE:
        icon.classList.add('inactive');
        icon.title = 'BackChannel Feedback - Click to activate';
        break;
      case FeedbackState.CAPTURE:
        icon.classList.add('capture');
        icon.title = 'BackChannel Feedback - Capture Mode Active';
        break;
      case FeedbackState.REVIEW:
        icon.classList.add('review');
        icon.title = 'BackChannel Feedback - Review Mode Active';
        break;
    }
  }

  /**
   * Set click handler for the icon
   */
  setClickHandler(handler: () => void): void {
    this.clickHandler = handler;

    // Remove existing listeners
    this.element.removeEventListener('click', this.handleClick);
    this.element.removeEventListener('keydown', this.handleKeydown);

    // Add new listeners
    this.element.addEventListener('click', this.handleClick);
    this.element.addEventListener('keydown', this.handleKeydown);
  }

  /**
   * Handle click events
   */
  private handleClick = (): void => {
    if (this.clickHandler) {
      this.clickHandler();
    }
  };

  /**
   * Handle keyboard events for accessibility
   */
  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleClick();
    }
  };

  /**
   * Get the current state
   */
  getState(): FeedbackState {
    return this.state;
  }

  /**
   * Get the DOM element
   */
  getElement(): HTMLElement {
    return this.element;
  }

  /**
   * Remove the icon from the DOM
   */
  destroy(): void {
    this.element.removeEventListener('click', this.handleClick);
    this.element.removeEventListener('keydown', this.handleKeydown);

    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
