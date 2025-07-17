/**
 * @fileoverview BackChannel Sidebar Component
 * @version 1.0.0
 * @author BackChannel Team
 */

import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { IBackChannelPlugin, CaptureComment } from '../types';

/**
 * BackChannel Sidebar Component
 * Provides the sidebar interface for feedback capture management
 */
@customElement('backchannel-sidebar')
export class BackChannelSidebar extends LitElement {
  @property({ type: Object })
  backChannelPlugin!: IBackChannelPlugin;

  @property({ type: Boolean })
  visible: boolean = false;

  @state()
  private comments: CaptureComment[] = [];

  @state()
  private loading: boolean = false;

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

    .comments-section {
      margin-top: 20px;
    }

    .comments-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 16px;
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .comment-item {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      border-left: 4px solid #007acc;
    }

    .comment-meta {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
    }

    .comment-text {
      font-size: 14px;
      color: #333;
      line-height: 1.4;
    }

    .comment-location {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
      font-style: italic;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .loading {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .loading-spinner {
      animation: spin 1s linear infinite;
      font-size: 24px;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
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
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadComments();
    this.restoreVisibilityState();
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
        <div class="comments-section">
          <h3 class="comments-title">Comments</h3>
          ${this.renderComments()}
        </div>
      </div>
    `;
  }

  private renderComments(): TemplateResult {
    if (this.loading) {
      return html`
        <div class="loading">
          <div class="loading-spinner">⟳</div>
          <div>Loading comments...</div>
        </div>
      `;
    }

    if (this.comments.length === 0) {
      return html`
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <div>No comments yet</div>
          <div style="margin-top: 8px; font-size: 14px;">
            Click "Capture Feedback" to add your first comment
          </div>
        </div>
      `;
    }

    return html`
      <div class="comments-list">
        ${this.comments.map(comment => this.renderComment(comment))}
      </div>
    `;
  }

  private renderComment(comment: CaptureComment): TemplateResult {
    const date = new Date(comment.timestamp).toLocaleString();
    const elementHint = this.getElementHint(comment.location);

    return html`
      <div class="comment-item">
        <div class="comment-meta">
          ${comment.author ? `${comment.author} • ` : ''}${date}
        </div>
        <div class="comment-text">${comment.text}</div>
        ${comment.snippet
          ? html`<div class="comment-location">"${comment.snippet}"</div>`
          : ''}
        <div class="comment-location">${elementHint}</div>
      </div>
    `;
  }

  private getElementHint(xpath: string): string {
    const parts = xpath.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart.includes('[')) {
      const tag = lastPart.split('[')[0];
      return `${tag} element`;
    }
    return lastPart || 'page element';
  }

  private async loadComments(): Promise<void> {
    if (!this.backChannelPlugin) return;

    this.loading = true;
    try {
      const dbService = await this.backChannelPlugin.getDatabaseService();
      const currentUrl = window.location.href;

      // Get all comments and filter by current page URL
      const allComments = await dbService.getComments();
      this.comments = allComments.filter(
        comment => comment.pageUrl === currentUrl
      );
    } catch (error) {
      console.error('Failed to load comments:', error);
      this.comments = [];
    } finally {
      this.loading = false;
    }
  }

  private closeSidebar(): void {
    this.visible = false;
    this.removeAttribute('visible');
    this.updateVisibilityState();
    this.dispatchEvent(new CustomEvent('sidebar-closed', { bubbles: true }));
  }

  private startCapture(): void {
    console.log('Starting feedback capture...');
    this.dispatchEvent(new CustomEvent('start-capture', { bubbles: true }));
  }

  private exportComments(): void {
    console.log('Exporting comments...');
    this.dispatchEvent(new CustomEvent('export-comments', { bubbles: true }));
  }

  private updateVisibilityState(): void {
    try {
      localStorage.setItem(
        'backchannel-sidebar-visible',
        this.visible.toString()
      );
    } catch (error) {
      console.warn('Failed to save sidebar visibility state:', error);
    }
  }

  private restoreVisibilityState(): void {
    try {
      const savedState = localStorage.getItem('backchannel-sidebar-visible');
      if (savedState === 'true') {
        this.visible = true;
        this.setAttribute('visible', 'true');
      } else {
        this.visible = false;
        this.removeAttribute('visible');
      }
    } catch (error) {
      console.warn('Failed to restore sidebar visibility state:', error);
      this.visible = false;
      this.removeAttribute('visible');
    }
  }

  /**
   * Show the sidebar
   */
  show(): void {
    this.visible = true;
    this.setAttribute('visible', 'true');
    this.updateVisibilityState();
    this.loadComments();
  }

  /**
   * Hide the sidebar
   */
  hide(): void {
    this.visible = false;
    this.removeAttribute('visible');
    this.updateVisibilityState();
  }

  /**
   * Toggle sidebar visibility
   */
  toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Refresh the comments list
   */
  refreshComments(): void {
    this.loadComments();
  }
}
