/**
 * Core types and interfaces for the BackChannel plugin
 */

/**
 * Represents the state of a feedback comment in review mode
 */
export enum CommentState {
  /** Comment is open and needs to be addressed */
  Open = 'open',
  /** Comment has been accepted by the editor */
  Accepted = 'accepted',
  /** Comment has been rejected by the editor */
  Rejected = 'rejected',
  /** Comment has been resolved */
  Resolved = 'resolved',
}

/**
 * Represents the operational mode of the BackChannel plugin
 */
export enum PluginMode {
  /** Mode for capturing and submitting feedback */
  Capture = 'capture',
  /** Mode for reviewing and managing feedback */
  Review = 'review',
}

/**
 * Represents document metadata
 */
export interface DocumentMetadata {
  /** Title of the document */
  documentTitle: string
  /** Root URL for the document set (shared URL prefix) */
  documentRootUrl: string
}

/**
 * Represents a comment created in Capture mode
 */
export interface CaptureComment {
  /** Unique identifier, derived from timestamp at creation */
  id: string
  /** Comment content */
  text: string
  /** Absolute URL of the page on which the comment was made */
  pageUrl: string
  /** Time the comment was created */
  timestamp: number
  /** An XPath string pointing to the DOM element the comment refers to */
  location: string
  /** A short snippet of text within the target element (optional) */
  snippet?: string
  /** Reviewer initials or short name (optional) */
  author?: string
}

/**
 * Represents a comment in Review mode, extending the CaptureComment
 */
export interface ReviewComment extends CaptureComment {
  /** Status of the comment */
  state: CommentState
  /** Optional notes from the editor */
  editorNotes?: string
  /** Initials or short name of the editor who handled the comment */
  reviewedBy?: string
  /** Timestamp of when the comment was reviewed */
  reviewedAt?: number
}

/**
 * Configuration options for the BackChannel plugin
 */
export interface BackChannelConfig {
  /** CSS selector for elements that can receive feedback (default: '.reviewable') */
  targetSelector?: string
  /** Whether to require initials when submitting feedback (default: true) */
  requireInitials?: boolean
  /** Whether to allow exporting feedback as CSV (default: true) */
  allowExport?: boolean
  /** Key used for localStorage caching (default: 'backchannel') */
  storageKey?: string
  /** Initial plugin mode (default: PluginMode.Capture) */
  initialMode?: PluginMode
  /** Whether to show the plugin icon on load (default: true) */
  showIconOnLoad?: boolean
  /** Position of the BackChannel icon (default: 'top-right') */
  iconPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}
