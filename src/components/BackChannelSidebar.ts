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

  @state()
  private showCommentForm: boolean = false;

  @state()
  private selectedElement: {
    tagName: string;
    xpath: string;
    textContent: string;
    [key: string]: unknown;
  } | null = null;

  @state()
  private commentText: string = '';

  @state()
  private commentAuthor: string = '';

  @state()
  private isSubmitting: boolean = false;

  @state()
  private formError: string = '';

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

    /* Comment Form Styles */
    .comment-form {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .comment-form-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 16px;
    }

    .element-info {
      background: #ffffff;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 16px;
      font-size: 14px;
      color: #666;
    }

    .element-info-label {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }

    .element-info-value {
      font-family: monospace;
      font-size: 12px;
      color: #666;
      word-break: break-all;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 6px;
    }

    .form-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: #007acc;
      box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
    }

    .form-textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
      min-height: 80px;
      resize: vertical;
      transition: border-color 0.2s ease;
    }

    .form-textarea:focus {
      outline: none;
      border-color: #007acc;
      box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
    }

    .form-buttons {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .form-button {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .form-button.primary {
      background: #007acc;
      color: white;
    }

    .form-button.primary:hover {
      background: #0056b3;
    }

    .form-button.primary:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .form-button.secondary {
      background: #6c757d;
      color: white;
    }

    .form-button.secondary:hover {
      background: #5a6268;
    }

    .form-error {
      color: #dc3545;
      font-size: 14px;
      margin-top: 8px;
      padding: 8px;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
    }

    .form-success {
      color: #155724;
      font-size: 14px;
      margin-top: 8px;
      padding: 8px;
      background: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 4px;
    }

    .character-count {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
      text-align: right;
    }

    .character-count.warning {
      color: #ffc107;
    }

    .character-count.error {
      color: #dc3545;
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
        ${this.showCommentForm ? this.renderCommentForm() : ''}
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

  /**
   * Show comment form for selected element
   */
  showCommentFormForElement(elementInfo: {
    tagName: string;
    xpath: string;
    textContent: string;
    [key: string]: unknown;
  }): void {
    this.selectedElement = elementInfo;
    this.showCommentForm = true;
    this.commentText = '';
    this.commentAuthor = '';
    this.formError = '';
    this.requestUpdate();
  }

  /**
   * Hide comment form
   */
  hideCommentForm(): void {
    this.showCommentForm = false;
    this.selectedElement = null;
    this.commentText = '';
    this.commentAuthor = '';
    this.formError = '';
    this.requestUpdate();
  }

  private renderCommentForm(): TemplateResult {
    if (!this.selectedElement) return html``;

    const textLength = this.commentText.length;
    const maxLength = 1000;
    const warningThreshold = 800;

    let characterCountClass = 'character-count';
    if (textLength > maxLength) {
      characterCountClass += ' error';
    } else if (textLength > warningThreshold) {
      characterCountClass += ' warning';
    }

    return html`
      <div class="comment-form">
        <h3 class="comment-form-title">Add Comment</h3>

        <div class="element-info">
          <div class="element-info-label">Selected Element:</div>
          <div class="element-info-value">${this.selectedElement.tagName}</div>
          ${this.selectedElement.textContent
            ? html`
                <div class="element-info-label" style="margin-top: 8px;">
                  Content:
                </div>
                <div class="element-info-value">
                  ${this.selectedElement.textContent.length > 100
                    ? this.selectedElement.textContent.substring(0, 100) + '...'
                    : this.selectedElement.textContent}
                </div>
              `
            : ''}
        </div>

        <div class="form-group">
          <label class="form-label" for="comment-text">Comment *</label>
          <textarea
            id="comment-text"
            class="form-textarea"
            placeholder="Enter your comment about this element..."
            .value=${this.commentText}
            @input=${this.handleCommentTextChange}
            maxlength="1000"
            required
            ?disabled=${this.isSubmitting}
          ></textarea>
          <div class="${characterCountClass}">
            ${textLength}/${maxLength} characters
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="comment-author"
            >Your Name (optional)</label
          >
          <input
            id="comment-author"
            type="text"
            class="form-input"
            placeholder="Enter your name or initials..."
            .value=${this.commentAuthor}
            @input=${this.handleCommentAuthorChange}
            maxlength="100"
            ?disabled=${this.isSubmitting}
          />
        </div>

        ${this.formError
          ? html`<div class="form-error">${this.formError}</div>`
          : ''}

        <div class="form-buttons">
          <button
            class="form-button secondary"
            @click=${this.handleCancelComment}
            ?disabled=${this.isSubmitting}
          >
            Cancel
          </button>
          <button
            class="form-button primary"
            @click=${this.handleSubmitComment}
            ?disabled=${this.isSubmitting ||
            !this.commentText.trim() ||
            this.commentText.length > maxLength}
          >
            ${this.isSubmitting ? 'Saving...' : 'Save Comment'}
          </button>
        </div>
      </div>
    `;
  }

  private handleCommentTextChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.commentText = target.value;
    this.formError = '';
    this.requestUpdate(); // Force re-render to update character count class
  }

  private handleCommentAuthorChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.commentAuthor = target.value;
  }

  private handleCancelComment(): void {
    this.hideCommentForm();
  }

  private async handleSubmitComment(): Promise<void> {
    if (!this.selectedElement || !this.commentText.trim()) {
      this.formError = 'Please enter a comment.';
      return;
    }

    if (this.commentText.length > 1000) {
      this.formError = 'Comment is too long. Maximum 1000 characters allowed.';
      return;
    }

    this.isSubmitting = true;
    this.formError = '';

    try {
      const dbService = await this.backChannelPlugin.getDatabaseService();

      // Store the selected element before clearing the form
      const selectedElementInfo = this.selectedElement;

      const comment = {
        id: Date.now().toString(),
        text: this.commentText.trim(),
        pageUrl: window.location.href,
        timestamp: new Date().toISOString(),
        location: selectedElementInfo!.xpath,
        snippet:
          selectedElementInfo!.textContent?.substring(0, 100) || undefined,
        author: this.commentAuthor.trim() || undefined,
      };

      await dbService.addComment(comment);

      // Show success feedback
      this.showSuccessMessage('Comment saved successfully!');

      // Clear form and hide it
      this.hideCommentForm();

      // Refresh comments list
      this.refreshComments();

      // Notify parent about new comment for visual feedback
      this.dispatchEvent(
        new CustomEvent('comment-added', {
          detail: { comment, element: selectedElementInfo },
          bubbles: true,
        })
      );
    } catch (error) {
      console.error('Failed to save comment:', error);
      this.formError = 'Failed to save comment. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }

  private showSuccessMessage(message: string): void {
    const successDiv = document.createElement('div');
    successDiv.className = 'form-success';
    successDiv.textContent = message;
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10001;
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
      border-radius: 4px;
      padding: 12px 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(successDiv);

    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 3000);
  }
}
