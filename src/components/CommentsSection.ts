/**
 * @fileoverview Comments Section Component
 * @version 1.0.0
 * @author BackChannel Team
 */

import { LitElement, html, css, TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import type { IBackChannelPlugin, CaptureComment } from '../types'

/**
 * Comments Section Component
 * Displays a list of comments with loading and empty states
 */
@customElement('comments-section')
export class CommentsSection extends LitElement {
  @property({ type: Object })
  backChannelPlugin!: IBackChannelPlugin

  @state()
  private comments: CaptureComment[] = []

  @state()
  private loading: boolean = false

  static styles = css`
    :host {
      display: block;
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
  `

  connectedCallback() {
    super.connectedCallback()
    this.loadComments()
  }

  render(): TemplateResult {
    return html`
      <div class="comments-section">
        <h3 class="comments-title">Comments</h3>
        ${this.renderComments()}
      </div>
    `
  }

  private renderComments(): TemplateResult {
    if (this.loading) {
      return html`
        <div class="loading">
          <div class="loading-spinner">⟳</div>
          <div>Loading comments...</div>
        </div>
      `
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
      `
    }

    return html`
      <div class="comments-list">
        ${this.comments.map(comment => this.renderComment(comment))}
      </div>
    `
  }

  private renderComment(comment: CaptureComment): TemplateResult {
    const date = new Date(comment.timestamp).toLocaleString()
    const elementHint = this.getElementHint(comment.location)

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
    `
  }

  private getElementHint(xpath: string): string {
    const parts = xpath.split('/')
    const lastPart = parts[parts.length - 1]
    if (lastPart.includes('[')) {
      const tag = lastPart.split('[')[0]
      return `${tag} element`
    }
    return lastPart || 'page element'
  }

  private async loadComments(): Promise<void> {
    if (!this.backChannelPlugin) return

    this.loading = true
    try {
      const dbService = await this.backChannelPlugin.getDatabaseService()
      const currentUrl = window.location.href

      // Get all comments and filter by current page URL
      const allComments = await dbService.getComments()
      this.comments = allComments.filter(
        comment => comment.pageUrl === currentUrl
      )
    } catch (error) {
      console.error('Failed to load comments:', error)
      this.comments = []
    } finally {
      this.loading = false
    }
  }

  /**
   * Refresh the comments list
   */
  refreshComments(): void {
    this.loadComments()
  }
}
