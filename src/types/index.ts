/**
 * @fileoverview Core type definitions for the BackChannel feedback plugin
 * @version 1.0.0
 * @author BackChannel Team
 */

import type { DatabaseService } from '../services/DatabaseService'

/**
 * Plugin operational states
 */
export enum FeedbackState {
  /** Plugin is loaded but not active */
  INACTIVE = 'inactive',
  /** Plugin is in feedback capture mode */
  CAPTURE = 'capture',
  /** Plugin is in review mode */
  REVIEW = 'review',
}

/**
 * Comment review states
 */
export enum CommentState {
  /** Comment is newly created */
  OPEN = 'open',
  /** Comment has been accepted by editor */
  ACCEPTED = 'accepted',
  /** Comment has been rejected by editor */
  REJECTED = 'rejected',
  /** Comment has been resolved */
  RESOLVED = 'resolved',
}

/**
 * Base comment structure for capture mode
 */
export interface CaptureComment {
  /** Unique identifier, derived from timestamp at creation */
  id: string
  /** Comment content */
  text: string
  /** Absolute URL of the page on which the comment was made */
  pageUrl: string
  /** ISO timestamp when the comment was created */
  timestamp: string
  /** XPath string pointing to the DOM element */
  location: string
  /** Optional snippet of text within the target element */
  snippet?: string
  /** Optional reviewer initials or short name */
  author?: string
}

/**
 * Extended comment structure for review mode
 */
export interface ReviewComment extends CaptureComment {
  /** Review status */
  state: CommentState
  /** Optional notes from the editor */
  editorNotes?: string
  /** Initials or short name of the editor who handled the comment */
  reviewedBy?: string
  /** ISO timestamp when the comment was reviewed */
  reviewedAt?: string
}

/**
 * Document metadata stored in the database
 */
export interface DocumentMetadata {
  /** Title of the document */
  documentTitle: string
  /** Shared URL prefix for the document set */
  documentRootUrl: string
  /** Optional unique identifier for the document */
  documentId?: string
  /** User name of the reviewer */
  reviewer?: string
}

/**
 * Plugin configuration options
 */
export interface PluginConfig {
  /** Whether to require user initials for comments (default: false) */
  requireInitials?: boolean
  /** Storage key for the current document (default: generated from URL) */
  storageKey?: string
  /** CSS selector for reviewable elements (default: '.reviewable') */
  targetSelector?: string
  /** Whether to allow CSV export functionality (default: true) */
  allowExport?: boolean
  /** Whether to enable debug mode (default: false) */
  debugMode?: boolean
}

/**
 * CSV export data structure
 */
export interface CSVExportData {
  /** Document metadata */
  metadata: DocumentMetadata
  /** Array of comments to export */
  comments: CaptureComment[]
}

/**
 * Storage interface for plugin data persistence
 */
export interface StorageInterface {
  /** Get document metadata */
  getMetadata(): Promise<DocumentMetadata | null>
  /** Set document metadata */
  setMetadata(metadata: DocumentMetadata): Promise<void>
  /** Get all comments */
  getComments(): Promise<CaptureComment[]>
  /** Add a new comment */
  addComment(comment: CaptureComment): Promise<void>
  /** Update an existing comment */
  updateComment(id: string, updates: Partial<CaptureComment>): Promise<void>
  /** Delete a comment */
  deleteComment(id: string): Promise<void>
}

/**
 * Type guard to check if a value is a valid CaptureComment
 */
export function isCaptureComment(value: unknown): value is CaptureComment {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).id === 'string' &&
    typeof (value as Record<string, unknown>).text === 'string' &&
    typeof (value as Record<string, unknown>).pageUrl === 'string' &&
    typeof (value as Record<string, unknown>).timestamp === 'string' &&
    typeof (value as Record<string, unknown>).location === 'string'
  )
}

/**
 * Type guard to check if a value is a valid ReviewComment
 */
export function isReviewComment(value: unknown): value is ReviewComment {
  return (
    isCaptureComment(value) &&
    'state' in (value as unknown as Record<string, unknown>) &&
    typeof (value as unknown as Record<string, unknown>).state === 'string' &&
    Object.values(CommentState).includes(
      (value as unknown as Record<string, unknown>).state as CommentState
    )
  )
}

/**
 * Utility type for creating new comments (without id and timestamp)
 */
export type NewComment = Omit<CaptureComment, 'id' | 'timestamp'>

/**
 * Utility type for comment updates
 */
export type CommentUpdate = Partial<Omit<CaptureComment, 'id'>>

/**
 * Fake database store structure for testing
 */
export interface FakeDbStore {
  /** Version of the fake data format */
  version: number
  /** Array of fake databases */
  databases: FakeDatabase[]
}

/**
 * Fake database structure for testing
 */
export interface FakeDatabase {
  /** Database name */
  name: string
  /** Database version */
  version: number
  /** Array of object stores */
  objectStores: FakeObjectStore[]
}

/**
 * Fake object store structure for testing
 */
export interface FakeObjectStore {
  /** Object store name */
  name: string
  /** Key path for the object store */
  keyPath: string
  /** Data items in the object store */
  data: unknown[]
}

/**
 * Interface for the main BackChannelPlugin class.
 * Used to avoid circular dependencies.
 */
export interface IBackChannelPlugin {
  getDatabaseService(): Promise<DatabaseService>
}

/**
 * Interface for the BackChannelIcon component's public API.
 */
export interface BackChannelIconAPI {
  setClickHandler(handler: () => void): void
}

/**
 * Element information structure for DOM element capture
 */
export interface ElementInfo {
  /** HTML tag name in lowercase */
  tagName: string
  /** XPath selector for the element */
  xpath: string
  /** CSS selector for the element */
  cssSelector: string
  /** Text content of the element */
  textContent: string
  /** Element attributes as key-value pairs */
  attributes: Record<string, string>
  /** Element's bounding rectangle */
  boundingRect: DOMRect
  /** Index of the element among its siblings */
  elementIndex: number
  /** Parent element information */
  parentInfo: string
  /** Allow additional properties */
  [key: string]: unknown
}
