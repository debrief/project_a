# Memory Bank Entry: Task 1.2 - Core Types & Interfaces

## Summary

Successfully implemented the core TypeScript interfaces and types for the BackChannel plugin as specified in Task 1.2 of the Implementation Plan. Created comprehensive type definitions for capture comments, review comments, document metadata, and plugin configuration based on the structures defined in the persistence.md document. Added enums for comment states and plugin modes. All types are properly documented with JSDoc comments and organized in a central types directory with appropriate exports.

## Details

### Implementation Approach

1. Created a central `/src/types/index.ts` file to contain all core interfaces and enums
2. Defined the following types with comprehensive JSDoc documentation based on the structures in persistence.md:
   - `CommentState` enum for comment states (Open, Accepted, Rejected, Resolved)
   - `PluginMode` enum for plugin modes (Capture, Review)
   - `DocumentMetadata` interface for document information
   - `CaptureComment` interface for feedback comments in capture mode
   - `ReviewComment` interface extending CaptureComment for review mode
   - Enhanced `BackChannelConfig` interface with additional configuration options
3. Updated references in the main plugin code to use the new types
4. Created unit tests to verify the types work as expected
5. Fixed linting issues to ensure code quality

### Code Changes

**1. Created `/src/types/index.ts` with all core interfaces and enums:**

```typescript
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
```

**2. Updated `/src/index.ts` to import and use the new types:**

```typescript
// Import types
import { BackChannelConfig, PluginMode } from './types'

// Updated constructor with new default values
constructor(config: BackChannelConfig = {}) {
  this.config = {
    targetSelector: '.reviewable',
    requireInitials: true,
    allowExport: true,
    storageKey: 'backchannel',
    initialMode: PluginMode.Capture,
    showIconOnLoad: true,
    iconPosition: 'top-right',
    ...config,
  }
}
```

**3. Updated `/src/types/global.d.ts` to reference the types from the new location:**

```typescript
import { BackChannelConfig } from './index'
import BackChannel from '../index'
```

**4. Created unit tests for the new types in `/tests/types.test.ts`**

## Outputs

1. All linting and TypeScript checks pass:

   ```
   $ yarn lint
   ✨  Done in 0.93s.

   $ yarn tsc --noEmit
   ✨  Done in 1.42s.
   ```

2. Unit tests pass:

   ```
   $ yarn test
   PASS  tests/types.test.ts
   PASS  src/tests/index.test.ts

   Test Suites: 2 passed, 2 total
   Tests:       7 passed, 7 total
   ```

3. Build completes successfully:
   ```
   $ yarn build
   ✓ built in 59ms
   ```

## Status

✅ **Complete**

The implementation of core types and interfaces is complete. All required interfaces and enums have been created with comprehensive JSDoc documentation. The types are organized in a central location for easy importing, and all code references have been updated to use the new types. Unit tests have been added to verify the types work as expected.

## Issues and Challenges

No significant issues were encountered during implementation. The task was completed successfully with all requirements met.

## Next Steps

1. Proceed to Task 1.3: Storage Service Implementation
2. Ensure the Storage Service uses the newly defined types for data persistence
3. Update any existing code to leverage the type system for improved safety and documentation
