/**
 * @fileoverview Feedback Form Component
 * @version 1.0.0
 * @author BackChannel Team
 */

import { LitElement, html, css, TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import type { IBackChannelPlugin } from '../types'

/**
 * Feedback Form Component
 * Provides a form interface for capturing feedback on selected elements
 */
@customElement('feedback-form')
export class FeedbackForm extends LitElement {
  @property({ type: Object })
  backChannelPlugin!: IBackChannelPlugin

  @property({ type: Object })
  selectedElement: {
    tagName: string
    xpath: string
    textContent: string
    [key: string]: unknown
  } | null = null

  @state()
  private commentText: string = ''

  @state()
  private commentAuthor: string = ''

  @state()
  private isSubmitting: boolean = false

  @state()
  private formError: string = ''

  static styles = css`
    :host {
      display: block;
    }

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
  `

  render(): TemplateResult {
    if (!this.selectedElement) return html``

    const textLength = this.commentText.length
    const maxLength = 1000
    const warningThreshold = 800

    let characterCountClass = 'character-count'
    if (textLength > maxLength) {
      characterCountClass += ' error'
    } else if (textLength > warningThreshold) {
      characterCountClass += ' warning'
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
    `
  }

  private handleCommentTextChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement
    this.commentText = target.value
    this.formError = ''
    this.requestUpdate()
  }

  private handleCommentAuthorChange(event: Event): void {
    const target = event.target as HTMLInputElement
    this.commentAuthor = target.value
  }

  private handleCancelComment(): void {
    this.resetForm()
    this.dispatchEvent(new CustomEvent('form-cancel', { bubbles: true }))
  }

  private async handleSubmitComment(): Promise<void> {
    if (!this.selectedElement || !this.commentText.trim()) {
      this.formError = 'Please enter a comment.'
      return
    }

    if (this.commentText.length > 1000) {
      this.formError = 'Comment is too long. Maximum 1000 characters allowed.'
      return
    }

    this.isSubmitting = true
    this.formError = ''

    try {
      const dbService = await this.backChannelPlugin.getDatabaseService()

      const selectedElementInfo = this.selectedElement

      const comment = {
        id: Date.now().toString(),
        text: this.commentText.trim(),
        pageUrl: window.location.href,
        timestamp: new Date().toISOString(),
        location: selectedElementInfo!.xpath,
        snippet:
          selectedElementInfo!.textContent?.substring(0, 100) || undefined,
        author: this.commentAuthor.trim() || undefined,
      }

      await dbService.addComment(comment)

      this.showSuccessMessage('Comment saved successfully!')

      this.resetForm()

      this.dispatchEvent(
        new CustomEvent('comment-saved', {
          detail: { comment, element: selectedElementInfo },
          bubbles: true,
        })
      )
    } catch (error) {
      console.error('Failed to save comment:', error)
      this.formError = 'Failed to save comment. Please try again.'
    } finally {
      this.isSubmitting = false
    }
  }

  private resetForm(): void {
    this.commentText = ''
    this.commentAuthor = ''
    this.formError = ''
    this.selectedElement = null
  }

  private showSuccessMessage(message: string): void {
    const successDiv = document.createElement('div')
    successDiv.className = 'form-success'
    successDiv.textContent = message
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
    `

    document.body.appendChild(successDiv)

    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv)
      }
    }, 3000)
  }

  /**
   * Set the form data for editing
   */
  setFormData(elementInfo: {
    tagName: string
    xpath: string
    textContent: string
    [key: string]: unknown
  }): void {
    this.selectedElement = elementInfo
    this.commentText = ''
    this.commentAuthor = ''
    this.formError = ''
    this.requestUpdate()
  }
}
