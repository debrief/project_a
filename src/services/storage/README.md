# BackChannel Storage Service

This module provides a complete storage solution for the BackChannel plugin, implementing Task 1.3 from the Implementation Plan.

## Overview

The storage service consists of several components:

- **StorageService**: Main service that coordinates all storage operations
- **DatabaseService**: Manages IndexedDB connections and operations
- **CacheService**: Handles localStorage caching for quick access
- **SeedDataService**: Utility for seeding the database with test data

## Features

- IndexedDB for persistent storage of feedback packages and comments
- localStorage caching for quick access to database information
- Connection pooling for efficient database management
- Full CRUD operations for comments
- Read and update operations for the single feedback package
- Versioned seeding for demo data
- Comprehensive error handling

## Usage

### Basic Usage

```typescript
import { StorageService } from './services/storage'
import { FeedbackPackage } from './types'

// Create a feedback package
const feedbackPackage: FeedbackPackage = {
  id: 'package-1',
  metadata: {
    documentTitle: 'Document Title',
    documentRootUrl: 'https://example.com/docs',
  },
  comments: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: '1.0.0',
}

// Initialize the storage service
const storageService = new StorageService(feedbackPackage)
await storageService.initialize()

// Use the storage service
const comment = await storageService.createComment({
  id: 'comment-1',
  text: 'This is a comment',
  pageUrl: 'https://example.com/docs/page1',
  timestamp: Date.now(),
  location: '/html/body/div[1]/p[2]',
  snippet: 'Sample text',
  author: 'User',
  state: CommentState.Open,
})

// Get comments for a specific page
const pageComments = await storageService.getCommentsByPage('https://example.com/docs/page1')

// Close the connection when done
storageService.close()
```

### Seeding Demo Data

```typescript
import { StorageService } from './services/storage'
import { attachDemoDatabaseSeed } from './services/storage/fakeData'

// Attach demo data to window object
attachDemoDatabaseSeed()

// Initialize storage service
const storageService = new StorageService(feedbackPackage)
await storageService.initialize()

// Seed the database if needed
await storageService.seedDatabaseIfNeeded()
```

## Architecture

### StorageService

The main service that coordinates all storage operations. It provides a unified interface for working with the database and cache.

### DatabaseService

Manages IndexedDB connections and operations. It handles:

- Database initialization and versioning
- Object store creation
- CRUD operations for comments
- Read and update operations for the feedback package
- Connection pooling

### CacheService

Handles localStorage caching for quick access to database information. It caches:

- Current feedback package URL
- Database name
- Seed version

### SeedDataService

Utility for seeding the database with test data. It ensures that:

- Data is only seeded once per version
- Seeding status is tracked in localStorage
- Demo data can be verified

## Error Handling

All operations include comprehensive error handling with detailed error messages. Errors are logged to the console and propagated to the caller.

## Testing

Unit tests are provided for all components using Jest. Run the tests with:

```bash
yarn test
```

## Dependencies

- IndexedDB API
- localStorage API
- TypeScript
