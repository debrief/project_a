export interface Comment {
  id: string;
  elementPath: string;
  elementText: string;
  commentText: string;
  timestamp: string;
  initials?: string;
  resolved?: boolean;
}

export interface FeedbackPackage {
  id: string;
  documentTitle: string;
  documentUrl: string;
  authorName: string;
  createdAt: string;
  urlPrefix?: string;
  comments: Comment[];
}

export interface PageMetadata {
  title: string;
  url: string;
  timestamp: string;
}

export interface PluginConfig {
  requireInitials?: boolean;
  storageKey?: string;
  targetSelector?: string;
  allowExport?: boolean;
}

export enum FeedbackState {
  INACTIVE = 'inactive',
  CAPTURE = 'capture',
  REVIEW = 'review',
}

export enum CommentStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  REOPENED = 'reopened',
}
