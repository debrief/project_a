/**
 * @fileoverview BackChannel Icon Component
 * @version 1.0.0
 * @author BackChannel Team
 */

import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BackChannelIconAPI, FeedbackState } from '../types';
import type { IBackChannelPlugin } from '../types';
import { PackageCreationModal } from './PackageCreationModal';

/**
 * BackChannel Icon Component
 * Provides the main UI element for accessing BackChannel functionality
 */
@customElement('backchannel-icon')
export class BackChannelIcon extends LitElement implements BackChannelIconAPI {
  @property({ type: Object })
  backChannelPlugin!: IBackChannelPlugin;

  @property({ type: String })
  state: FeedbackState = FeedbackState.INACTIVE;

  @property({ type: Boolean })
  enabled: boolean = false;

  @property()
  clickHandler?: () => void;

  @state()
  private packageModal: PackageCreationModal | null = null;

  static styles = css`
    :host {
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

    :host(:hover) {
      background: #f8f9fa;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    :host(:focus) {
      outline: none;
      box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.3);
    }

    :host(:active) {
      transform: translateY(0);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    /* Enabled/disabled styling */
    :host([enabled='false']) {
      color: #dc3545;
      border-color: #dc3545;
      background: #f8f9fa;
      opacity: 0.7;
    }

    :host([enabled='false']) .backchannel-icon-badge {
      fill: #dc3545;
    }

    :host([enabled='false']:hover) {
      background: #e2e6ea;
      transform: translateY(-1px);
    }

    /* State-based styling (only when enabled) */
    :host([enabled='true'][state='inactive']) {
      color: #6c757d;
      border-color: #6c757d;
    }

    :host([enabled='true'][state='inactive']) .backchannel-icon-badge {
      fill: #6c757d;
    }

    :host([enabled='true'][state='capture']) {
      color: #007acc;
      border-color: #007acc;
      background: #e3f2fd;
    }

    :host([enabled='true'][state='capture']) .backchannel-icon-badge {
      fill: #007acc;
    }

    :host([enabled='true'][state='review']) {
      color: #28a745;
      border-color: #28a745;
      background: #e8f5e8;
    }

    :host([enabled='true'][state='review']) .backchannel-icon-badge {
      fill: #28a745;
    }

    /* Animation for state changes */
    :host(.state-changing) {
      animation: pulse 0.5s ease-in-out;
    }

    @keyframes pulse {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
      }
    }

    /* Responsive positioning */
    @media (max-width: 768px) {
      :host {
        top: 15px;
        right: 15px;
        width: 44px;
        height: 44px;
      }
    }

    @media (max-width: 480px) {
      :host {
        top: 10px;
        right: 10px;
        width: 40px;
        height: 40px;
      }
    }

    /* Handle window resize and ensure icon stays visible */
    @media (max-height: 400px) {
      :host {
        top: 10px;
      }
    }

    /* Ensure icon doesn't interfere with page content */
    svg {
      pointer-events: none;
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
      :host {
        border-width: 3px;
        box-shadow: 0 0 0 1px #000000;
      }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      :host {
        transition: none;
      }

      :host(:hover) {
        transform: none;
      }

      :host(.state-changing) {
        animation: none;
      }
    }

    /* Print styles - hide icon when printing */
    @media print {
      :host {
        display: none;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'button');
    this.setAttribute('tabindex', '0');
    this.setAttribute('id', 'backchannel-icon');
    this.setAttribute('state', this.state);
    this.setAttribute('enabled', this.enabled.toString());
    this.updateTitle();
    // The modal is now initialized lazily when the icon is clicked

    // Add event listeners to the host element
    this.addEventListener('click', this.handleClick);
    this.addEventListener('keydown', this.handleKeydown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanupModal();

    // Remove event listeners
    this.removeEventListener('click', this.handleClick);
    this.removeEventListener('keydown', this.handleKeydown);
  }

  render(): TemplateResult {
    return html`
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 2H4C2.9 2 2 2.9 2 4V16C2 17.1 2.9 18 4 18H6L10 22L14 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
        />
        <path
          d="M8 8H16"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
        <path
          d="M8 12H16"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
        <circle
          cx="18"
          cy="6"
          r="3"
          fill="currentColor"
          class="backchannel-icon-badge"
        />
      </svg>
    `;
  }

  /**
   * Initialize the package creation modal
   */
  private async initializeModal(): Promise<void> {
    if (!this.backChannelPlugin) return;

    // Lazily get the database service only when the modal is needed
    const dbService = await this.backChannelPlugin.getDatabaseService();

    this.packageModal = new PackageCreationModal();
    this.packageModal.databaseService = dbService;
    this.packageModal.options = {
      onSuccess: () => {
        // Enable BackChannel and set to capture mode
        this.setEnabled(true);
        this.setState(FeedbackState.CAPTURE);

        // Notify the main plugin that BackChannel is now enabled
        if (typeof window !== 'undefined' && window.BackChannel) {
          window.BackChannel.enableBackChannel();
        }
      },
      onCancel: () => {},
      onError: error => {
        console.error('Package creation failed:', error);
        alert('Failed to create feedback package. Please try again.');
      },
    };

    // Add modal to DOM
    document.body.appendChild(this.packageModal);
  }

  /**
   * Clean up modal
   */
  private cleanupModal(): void {
    if (this.packageModal && this.packageModal.parentNode) {
      this.packageModal.parentNode.removeChild(this.packageModal);
    }
  }

  /**
   * Set the icon state and update visual appearance
   */
  setState(newState: FeedbackState): void {
    this.state = newState;
    this.setAttribute('state', newState);
    this.updateTitle();
    this.requestUpdate();
  }

  /**
   * Set the enabled state and update visual appearance
   */
  setEnabled(isEnabled: boolean): void {
    this.enabled = isEnabled;
    this.setAttribute('enabled', isEnabled.toString());
    this.updateTitle();
    this.requestUpdate();
  }

  /**
   * Update the icon's title based on state
   */
  private updateTitle(): void {
    let title = 'BackChannel Feedback';

    if (!this.enabled) {
      title = 'BackChannel Feedback - Click to create feedback package';
    } else {
      switch (this.state) {
        case FeedbackState.INACTIVE:
          title = 'BackChannel Feedback - Click to activate';
          break;
        case FeedbackState.CAPTURE:
          title = 'BackChannel Feedback - Capture Mode Active';
          break;
        case FeedbackState.REVIEW:
          title = 'BackChannel Feedback - Review Mode Active';
          break;
      }
    }

    this.setAttribute('title', title);
  }

  /**
   * Set click handler for the icon
   */
  setClickHandler(handler: () => void): void {
    this.clickHandler = handler;
  }

  /**
   * Handle click events
   */
  private handleClick = async (): Promise<void> => {
    // If not enabled, the default action is to open the package creation modal
    if (!this.enabled) {
      // Initialize the modal just-in-time
      if (!this.packageModal) {
        await this.initializeModal();
      }
      this.openPackageModal();
      return;
    }

    // If enabled, defer to the main plugin's click handler for state changes
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
   * Open the package creation modal
   */
  openPackageModal(): void {
    if (this.packageModal) {
      this.packageModal.show();
    }
  }
}
