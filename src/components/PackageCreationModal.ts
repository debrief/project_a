/**
 * @fileoverview PackageCreationModal Component
 * @version 1.0.0
 * @author BackChannel Team
 */

import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { DocumentMetadata } from '../types';
import { DatabaseService } from '../services/DatabaseService';

export interface PackageCreationForm {
  documentTitle: string;
  reviewerName: string;
  urlPrefix: string;
}

export interface PackageCreationModalOptions {
  onSuccess?: (metadata: DocumentMetadata) => void;
  onCancel?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Modal component for creating new feedback packages
 */
@customElement('package-creation-modal')
export class PackageCreationModal extends LitElement {
  @property({ type: Object })
  databaseService!: DatabaseService;

  @property({ type: Object })
  options: PackageCreationModalOptions = {};

  @state()
  private isVisible = false;

  @state()
  private hasUnsavedChanges = false;

  @state()
  private isLoading = false;

  @state()
  private formErrors: Record<string, string> = {};

  @query('form')
  private form!: HTMLFormElement;

  static styles = css`
    :host {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 99999;
    }

    :host([visible]) {
      display: block;
    }

    /* Modal backdrop */
    .backchannel-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
    }

    /* Modal container */
    .backchannel-modal {
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
    }

    /* Modal content */
    .backchannel-modal-content {
      padding: 0;
    }

    /* Modal header */
    .backchannel-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 24px 16px;
      border-bottom: 1px solid #e9ecef;
    }

    .backchannel-modal-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #212529;
      line-height: 1.2;
    }

    .backchannel-modal-close {
      background: none;
      border: none;
      color: #6c757d;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition:
        color 0.15s ease-in-out,
        background-color 0.15s ease-in-out;
    }

    .backchannel-modal-close:hover {
      color: #495057;
      background-color: #f8f9fa;
    }

    .backchannel-modal-close:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.25);
    }

    /* Modal body */
    .backchannel-modal-body {
      padding: 16px 24px 24px;
    }

    .backchannel-modal-description {
      margin: 0 0 24px;
      color: #6c757d;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    /* Form styles */
    .backchannel-package-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .backchannel-form-group {
      display: flex;
      flex-direction: column;
    }

    .backchannel-form-label {
      font-weight: 500;
      color: #212529;
      margin-bottom: 6px;
      font-size: 0.875rem;
    }

    .backchannel-required {
      color: #dc3545;
      font-weight: normal;
    }

    .backchannel-form-input {
      padding: 12px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 1rem;
      font-family: inherit;
      transition:
        border-color 0.15s ease-in-out,
        box-shadow 0.15s ease-in-out;
      background-color: #ffffff;
    }

    .backchannel-form-input:focus {
      outline: none;
      border-color: #007acc;
      box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.25);
    }

    .backchannel-form-input::placeholder {
      color: #6c757d;
    }

    .backchannel-form-input.error {
      border-color: #dc3545;
    }

    .backchannel-form-input.error:focus {
      border-color: #dc3545;
      box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25);
    }

    .backchannel-form-help {
      margin-top: 4px;
      font-size: 0.75rem;
      color: #6c757d;
      line-height: 1.4;
    }

    .backchannel-form-error {
      margin-top: 4px;
      font-size: 0.75rem;
      color: #dc3545;
      line-height: 1.4;
      min-height: 1rem;
    }

    /* Form actions */
    .backchannel-form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 8px;
      padding-top: 16px;
      border-top: 1px solid #e9ecef;
    }

    /* Button styles */
    .backchannel-btn {
      padding: 12px 24px;
      border: none;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      font-family: inherit;
      line-height: 1;
    }

    .backchannel-btn:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.25);
    }

    .backchannel-btn-primary {
      background-color: #007acc;
      color: #ffffff;
    }

    .backchannel-btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .backchannel-btn-primary:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }

    .backchannel-btn-secondary {
      background-color: #6c757d;
      color: #ffffff;
    }

    .backchannel-btn-secondary:hover:not(:disabled) {
      background-color: #5a6268;
    }

    .backchannel-btn-loading {
      display: none;
      align-items: center;
      gap: 8px;
    }

    .backchannel-btn-loading.visible {
      display: flex;
    }

    .backchannel-btn-text.hidden {
      display: none;
    }

    /* Spinner animation */
    .backchannel-spinner {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .backchannel-modal-backdrop {
        padding: 16px;
      }

      .backchannel-modal {
        max-width: none;
        width: 100%;
        max-height: 95vh;
      }

      .backchannel-modal-header {
        padding: 20px 20px 16px;
      }

      .backchannel-modal-body {
        padding: 16px 20px 20px;
      }

      .backchannel-modal-title {
        font-size: 1.25rem;
      }

      .backchannel-form-actions {
        flex-direction: column-reverse;
      }

      .backchannel-btn {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .backchannel-modal-backdrop {
        padding: 12px;
      }

      .backchannel-modal-header {
        padding: 16px 16px 12px;
      }

      .backchannel-modal-body {
        padding: 12px 16px 16px;
      }

      .backchannel-package-form {
        gap: 16px;
      }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .backchannel-form-input,
      .backchannel-btn,
      .backchannel-modal-close {
        transition: none;
      }

      .backchannel-spinner {
        animation: none;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.handleKeydown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleKeydown);
    this.restoreBodyScroll();
  }

  render(): TemplateResult {
    if (!this.isVisible) {
      return html``;
    }

    const urlPrefix = this.getDefaultUrlPrefix();

    return html`
      <div
        class="backchannel-modal-backdrop"
        @click=${this.handleBackdropClick}
      >
        <div
          class="backchannel-modal"
          role="dialog"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
          aria-modal="true"
        >
          <div class="backchannel-modal-content">
            <div class="backchannel-modal-header">
              <h2 id="modal-title" class="backchannel-modal-title">
                Create Feedback Package
              </h2>
              <button
                type="button"
                class="backchannel-modal-close"
                aria-label="Close modal"
                @click=${this.handleClose}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div class="backchannel-modal-body">
              <p id="modal-description" class="backchannel-modal-description">
                Set up a new feedback package to begin capturing comments and
                feedback for this document.
              </p>

              <form
                class="backchannel-package-form"
                @submit=${this.handleSubmit}
                novalidate
              >
                <div class="backchannel-form-group">
                  <label for="document-title" class="backchannel-form-label">
                    Document Title <span class="backchannel-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="document-title"
                    name="documentTitle"
                    class="backchannel-form-input ${this.formErrors
                      .documentTitle
                      ? 'error'
                      : ''}"
                    required
                    maxlength="200"
                    aria-describedby="document-title-error"
                    placeholder="Enter the document title"
                    @input=${this.handleInput}
                    @blur=${this.handleBlur}
                  />
                  <div
                    id="document-title-error"
                    class="backchannel-form-error"
                    role="alert"
                    aria-live="polite"
                  >
                    ${this.formErrors.documentTitle || ''}
                  </div>
                </div>

                <div class="backchannel-form-group">
                  <label for="reviewer-name" class="backchannel-form-label">
                    Reviewer Name <span class="backchannel-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="reviewer-name"
                    name="reviewerName"
                    class="backchannel-form-input ${this.formErrors.reviewerName
                      ? 'error'
                      : ''}"
                    required
                    maxlength="100"
                    aria-describedby="reviewer-name-error"
                    placeholder="Enter your name"
                    @input=${this.handleInput}
                    @blur=${this.handleBlur}
                  />
                  <div
                    id="reviewer-name-error"
                    class="backchannel-form-error"
                    role="alert"
                    aria-live="polite"
                  >
                    ${this.formErrors.reviewerName || ''}
                  </div>
                </div>

                <div class="backchannel-form-group">
                  <label for="url-prefix" class="backchannel-form-label">
                    URL Prefix <span class="backchannel-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="url-prefix"
                    name="urlPrefix"
                    class="backchannel-form-input ${this.formErrors.urlPrefix
                      ? 'error'
                      : ''}"
                    required
                    aria-describedby="url-prefix-error url-prefix-help"
                    placeholder="Enter the URL prefix"
                    .value=${urlPrefix}
                    @input=${this.handleInput}
                    @blur=${this.handleBlur}
                  />
                  <div id="url-prefix-help" class="backchannel-form-help">
                    This prefix will match all documents in the same folder
                    tree. Default is set to the parent folder of the current
                    document.
                  </div>
                  <div
                    id="url-prefix-error"
                    class="backchannel-form-error"
                    role="alert"
                    aria-live="polite"
                  >
                    ${this.formErrors.urlPrefix || ''}
                  </div>
                </div>

                <div class="backchannel-form-actions">
                  <button
                    type="button"
                    class="backchannel-btn backchannel-btn-secondary"
                    @click=${this.handleClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="backchannel-btn backchannel-btn-primary"
                    ?disabled=${this.isLoading}
                  >
                    <span
                      class="backchannel-btn-text ${this.isLoading
                        ? 'hidden'
                        : ''}"
                      >Create Package</span
                    >
                    <span
                      class="backchannel-btn-loading ${this.isLoading
                        ? 'visible'
                        : ''}"
                    >
                      <svg
                        class="backchannel-spinner"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="2"
                          fill="none"
                          opacity="0.25"
                        />
                        <path
                          d="M12 2v6"
                          stroke="currentColor"
                          stroke-width="2"
                          opacity="0.75"
                        />
                      </svg>
                      Creating...
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get default URL prefix from current location
   */
  private getDefaultUrlPrefix(): string {
    if (typeof window !== 'undefined' && window.location) {
      const url = new URL(window.location.href);
      const pathSegments = url.pathname
        .split('/')
        .filter(segment => segment.length > 0);

      if (pathSegments.length > 0) {
        // Remove the last segment (current file) to get parent folder
        pathSegments.pop();
        const parentPath =
          pathSegments.length > 0 ? '/' + pathSegments.join('/') + '/' : '/';
        return `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}${parentPath}`;
      }

      return `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}/`;
    }
    return 'file://';
  }

  /**
   * Handle input events for real-time validation
   */
  private handleInput = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    this.markAsModified();
    this.validateField(input);
  };

  /**
   * Handle blur events for validation
   */
  private handleBlur = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    this.validateField(input);
  };

  /**
   * Handle backdrop click
   */
  private handleBackdropClick = (e: Event): void => {
    if (e.target === e.currentTarget) {
      this.handleClose();
    }
  };

  /**
   * Handle keyboard events
   */
  private handleKeydown = (e: KeyboardEvent): void => {
    if (!this.isVisible) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.handleClose();
    }
  };

  /**
   * Handle form submission
   */
  private handleSubmit = async (e: Event): Promise<void> => {
    e.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    const formData = new FormData(this.form);
    const packageData: PackageCreationForm = {
      documentTitle: formData.get('documentTitle') as string,
      reviewerName: formData.get('reviewerName') as string,
      urlPrefix: formData.get('urlPrefix') as string,
    };

    try {
      this.isLoading = true;

      const metadata: DocumentMetadata = {
        documentTitle: packageData.documentTitle.trim(),
        documentRootUrl: packageData.urlPrefix.trim(),
        reviewer: packageData.reviewerName.trim(),
        documentId: this.generateDocumentId(),
      };

      await this.databaseService.setMetadata(metadata);

      this.options.onSuccess?.(metadata);
      this.close();
    } catch (error) {
      console.error('Failed to create feedback package:', error);
      this.options.onError?.(error as Error);
    } finally {
      this.isLoading = false;
    }
  };

  /**
   * Handle modal close
   */
  private handleClose = (): void => {
    if (this.hasUnsavedChanges) {
      const confirmed = confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmed) {
        return;
      }
    }

    this.options.onCancel?.();
    this.close();
  };

  /**
   * Mark form as modified
   */
  private markAsModified(): void {
    this.hasUnsavedChanges = true;
  }

  /**
   * Validate a specific form field
   */
  private validateField(input: HTMLInputElement): boolean {
    let isValid = true;
    let errorMessage = '';

    const fieldName = input.name;

    // Required field validation
    if (input.required && !input.value.trim()) {
      isValid = false;
      errorMessage = `${input.labels?.[0]?.textContent?.replace(' *', '') || 'This field'} is required`;
    }

    // Length validation
    else if (
      input.maxLength > 0 &&
      input.value.trim().length > input.maxLength
    ) {
      isValid = false;
      errorMessage = `Maximum ${input.maxLength} characters allowed`;
    }

    // URL prefix validation
    else if (input.name === 'urlPrefix' && input.value.trim()) {
      try {
        new URL(input.value.trim());
      } catch {
        isValid = false;
        errorMessage = 'Please enter a valid URL';
      }
    }

    // Update form errors
    if (!isValid) {
      this.formErrors = { ...this.formErrors, [fieldName]: errorMessage };
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [fieldName]: _, ...restErrors } = this.formErrors;
      this.formErrors = restErrors;
    }

    return isValid;
  }

  /**
   * Validate entire form
   */
  private validateForm(): boolean {
    const inputs = this.form.querySelectorAll(
      'input[required]'
    ) as NodeListOf<HTMLInputElement>;
    let isValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Generate a unique document ID
   */
  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Prevent body scroll when modal is open
   */
  private preventBodyScroll(): void {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('backchannel-modal-open');
  }

  /**
   * Restore body scroll when modal is closed
   */
  private restoreBodyScroll(): void {
    document.body.style.overflow = '';
    document.body.classList.remove('backchannel-modal-open');
  }

  /**
   * Show the modal
   */
  show(): void {
    if (this.isVisible) return;

    this.isVisible = true;
    this.hasUnsavedChanges = false;
    this.formErrors = {};
    this.setAttribute('visible', '');

    this.preventBodyScroll();

    // Focus on first input after render
    this.updateComplete.then(() => {
      const firstInput = this.shadowRoot?.querySelector(
        'input'
      ) as HTMLInputElement;
      setTimeout(() => firstInput?.focus(), 100);
    });
  }

  /**
   * Hide the modal
   */
  close(): void {
    if (!this.isVisible) return;

    this.isVisible = false;
    this.hasUnsavedChanges = false;
    this.formErrors = {};
    this.removeAttribute('visible');

    this.restoreBodyScroll();

    // Reset form
    this.updateComplete.then(() => {
      this.form?.reset();
      // Reset URL prefix to default
      const urlPrefixInput = this.shadowRoot?.querySelector(
        '#url-prefix'
      ) as HTMLInputElement;
      if (urlPrefixInput) {
        urlPrefixInput.value = this.getDefaultUrlPrefix();
      }
    });
  }

  /**
   * Get current visibility state
   */
  isOpen(): boolean {
    return this.isVisible;
  }
}
