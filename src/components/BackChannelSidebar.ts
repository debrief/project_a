/**
 * @fileoverview BackChannel Sidebar Component
 * @version 1.0.0
 * @author BackChannel Team
 */

import { LitElement, html, css, TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import type { IBackChannelPlugin } from '../types'
import type { CommentsSection } from './CommentsSection'
import './FeedbackForm.js'
import './CommentsSection.js'

/**
 * BackChannel Sidebar Component
 * Provides the sidebar interface for feedback capture management
 */
@customElement('backchannel-sidebar')
export class BackChannelSidebar extends LitElement {
  @property({ type: Object })
  backChannelPlugin!: IBackChannelPlugin

  @property({ type: Boolean })
  visible: boolean = false

  @state()
  private showCommentForm: boolean = false

  @state()
  private selectedElement: {
    tagName: string
    xpath: string
    textContent: string
    [key: string]: unknown
  } | null = null

  static styles = css`
    :host {
      position: fixed;
      top: 0;
      right: 0;
      width: 400px;
      height: 100vh;
      background: #ffffff;
      border-left: 1px solid #e0e0e0;
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    }

    :host([visible]) {
      transform: translateX(0);
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    .sidebar-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0 0 16px 0;
    }

    .close-button {
      position: absolute;
      top: 20px;
      right: 20px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .close-button:hover {
      background: #e9ecef;
      color: #333;
    }

    .toolbar {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }

    .toolbar button {
      flex: 1;
      padding: 10px 16px;
      border: 1px solid #007acc;
      border-radius: 4px;
      background: #ffffff;
      color: #007acc;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .toolbar button:hover {
      background: #007acc;
      color: #ffffff;
    }

    .toolbar button:active {
      transform: translateY(1px);
    }

    .toolbar button.primary {
      background: #007acc;
      color: #ffffff;
    }

    .toolbar button.primary:hover {
      background: #0056b3;
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      :host {
        width: 320px;
      }
    }

    @media (max-width: 480px) {
      :host {
        width: 100%;
      }
    }

    /* Accessibility improvements */
    .close-button:focus {
      outline: 2px solid #007acc;
      outline-offset: 2px;
    }

    .toolbar button:focus {
      outline: 2px solid #007acc;
      outline-offset: 2px;
    }

    /* Ensure content doesn't interfere with scrolling */
    .sidebar-content::-webkit-scrollbar {
      width: 8px;
    }

    .sidebar-content::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    .sidebar-content::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }

    .sidebar-content::-webkit-scrollbar-thumb:hover {
      background: #a1a1a1;
    }
  `

  connectedCallback() {
    super.connectedCallback()
    this.restoreVisibilityState()
  }

  render(): TemplateResult {
    return html`
      <div class="sidebar-header">
        <button
          class="close-button"
          @click="${this.closeSidebar}"
          title="Close sidebar"
          aria-label="Close sidebar"
        >
          ×
        </button>
        <h2 class="sidebar-title">BackChannel Feedback</h2>
        <div class="toolbar">
          <button
            class="primary"
            @click="${this.startCapture}"
            title="Capture feedback on page elements"
          >
            Capture Feedback
          </button>
          <button
            @click="${this.exportComments}"
            title="Export comments to CSV"
          >
            Export
          </button>
        </div>
      </div>

      <div class="sidebar-content">
        ${this.showCommentForm ? this.renderCommentForm() : ''}
        <comments-section
          .backChannelPlugin=${this.backChannelPlugin}
        ></comments-section>
      </div>
    `
  }

  private closeSidebar(): void {
    this.visible = false
    this.removeAttribute('visible')
    this.updateVisibilityState()
    this.dispatchEvent(new CustomEvent('sidebar-closed', { bubbles: true }))
  }

  private startCapture(): void {
    console.log('Starting feedback capture...')
    this.dispatchEvent(new CustomEvent('start-capture', { bubbles: true }))
  }

  private exportComments(): void {
    console.log('Exporting comments...')
    this.dispatchEvent(new CustomEvent('export-comments', { bubbles: true }))
  }

  private updateVisibilityState(): void {
    try {
      localStorage.setItem(
        'backchannel-sidebar-visible',
        this.visible.toString()
      )
    } catch (error) {
      console.warn('Failed to save sidebar visibility state:', error)
    }
  }

  private restoreVisibilityState(): void {
    try {
      const savedState = localStorage.getItem('backchannel-sidebar-visible')
      if (savedState === 'true') {
        this.visible = true
        this.setAttribute('visible', 'true')
      } else {
        this.visible = false
        this.removeAttribute('visible')
      }
    } catch (error) {
      console.warn('Failed to restore sidebar visibility state:', error)
      this.visible = false
      this.removeAttribute('visible')
    }
  }

  /**
   * Show the sidebar
   */
  show(): void {
    this.visible = true
    this.setAttribute('visible', 'true')
    this.updateVisibilityState()
  }

  /**
   * Hide the sidebar
   */
  hide(): void {
    this.visible = false
    this.removeAttribute('visible')
    this.updateVisibilityState()
  }

  /**
   * Toggle sidebar visibility
   */
  toggle(): void {
    if (this.visible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * Refresh the comments list
   */
  refreshComments(): void {
    const commentsSection = this.shadowRoot?.querySelector(
      'comments-section'
    ) as CommentsSection
    if (commentsSection) {
      commentsSection.refreshComments()
    }
  }

  /**
   * Show comment form for selected element
   */
  showCommentFormForElement(elementInfo: {
    tagName: string
    xpath: string
    textContent: string
    [key: string]: unknown
  }): void {
    this.selectedElement = elementInfo
    this.showCommentForm = true
    this.requestUpdate()
  }

  /**
   * Hide comment form
   */
  hideCommentForm(): void {
    this.showCommentForm = false
    this.selectedElement = null
    this.requestUpdate()
  }

  private renderCommentForm(): TemplateResult {
    if (!this.selectedElement) return html``

    return html`
      <feedback-form
        .backChannelPlugin=${this.backChannelPlugin}
        .selectedElement=${this.selectedElement}
        @form-cancel=${this.handleFormCancel}
        @comment-saved=${this.handleCommentSaved}
      ></feedback-form>
    `
  }

  private handleFormCancel(): void {
    this.hideCommentForm()
  }

  private handleCommentSaved(event: CustomEvent): void {
    const { comment, element } = event.detail

    this.hideCommentForm()
    this.refreshComments()

    this.dispatchEvent(
      new CustomEvent('comment-added', {
        detail: { comment, element },
        bubbles: true,
      })
    )
  }
}
