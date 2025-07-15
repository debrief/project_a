# DatabaseService & SeedDemoDatabase API Design

## Overview

Based on analysis of real application usage patterns, this document defines the API design for the `DatabaseService` and `seedDemoDatabase` modules. These modules provide data persistence and demo data seeding functionality for the BackChannel plugin.

## DatabaseService API

### Constructor

```typescript
constructor(
  fakeIndexedDb?: IDBFactory,
  dbName?: string, 
  dbVersion?: number
)
```

**Purpose**: Creates a new DatabaseService instance with optional configuration.

**Parameters**:
- `fakeIndexedDb` (optional): Mock IndexedDB implementation for testing
- `dbName` (optional): Database name (defaults to 'BackChannelDB')
- `dbVersion` (optional): Database version (defaults to 1)

**Usage**: Called during plugin initialization with optional fake data configuration.

### Core Database Operations

#### `initialize(): Promise<void>`

**Purpose**: Initializes the IndexedDB database connection and sets up object stores.

**Behavior**:
- Opens database connection with configured name and version
- Creates metadata and comments object stores if they don't exist
- Caches basic database information to localStorage
- Sets up database schema on version upgrades

**Usage**: Called once during plugin initialization after DatabaseService construction.

**Error Handling**: Throws error if IndexedDB is not supported or database cannot be opened.

#### `clear(): Promise<void>`

**Purpose**: Clears all data from the database (metadata and comments).

**Behavior**:
- Removes all entries from metadata object store
- Removes all entries from comments object store
- Provides clean slate for seeding or testing

**Usage**: Called before seeding demo data to ensure clean state.

### Metadata Operations

#### `getMetadata(): Promise<DocumentMetadata | null>`

**Purpose**: Retrieves document metadata from the database.

**Returns**: DocumentMetadata object or null if no metadata exists.

**Usage**: 
- Called when checking for existing packages in `checkMetadataOrCreatePackage()`
- Used to determine if BackChannel should be enabled

#### `setMetadata(metadata: DocumentMetadata): Promise<void>`

**Purpose**: Stores document metadata in the database.

**Parameters**:
- `metadata`: Document metadata object containing title, URL root, ID, and reviewer

**Usage**: 
- Called when creating new feedback packages via PackageCreationModal
- Called during demo data seeding

### Comment Operations

#### `addComment(comment: CaptureComment): Promise<void>`

**Purpose**: Adds a new comment to the database.

**Parameters**:
- `comment`: Complete comment object with ID, text, location, timestamp, etc.

**Usage**: 
- Called during demo data seeding to populate sample comments
- Will be called during normal feedback capture operation

#### `getComments(): Promise<CaptureComment[]>`

**Purpose**: Retrieves all comments from the database.

**Returns**: Array of CaptureComment objects.

**Usage**: For displaying existing comments and exporting feedback data.

### Enabled/Disabled Detection

#### `isBackChannelEnabled(): Promise<boolean>`

**Purpose**: Determines if BackChannel should be enabled for the current page.

**Algorithm**:
1. Fast path: Check localStorage cache for enabled state
2. Slow path: Scan database for URL matches if cache miss
3. Return true if current URL matches any stored document root URL

**Caching**: Uses localStorage to cache enabled state with URL-based invalidation.

**Usage**: Called during plugin initialization to determine initial enabled state.

#### `clearEnabledStateCache(): void`

**Purpose**: Clears the cached enabled state to force re-evaluation.

**Usage**: Called after successful package creation to ensure enabled state reflects new data.

### Database Configuration Support

#### `getCurrentPageUrl(): string`

**Purpose**: Gets the current page URL for enabled/disabled detection.

**Returns**: Current window location as string.

#### `getDocumentUrlRoot(): string`

**Purpose**: Extracts document root URL from current page for caching.

**Returns**: Base URL path for document identification.

## SeedDemoDatabase API

### Main Seeding Function

#### `seedDemoDatabaseIfNeeded(): Promise<boolean>`

**Purpose**: Seeds the database with demo data if the version hasn't been applied before.

**Algorithm**:
1. Check if `window.demoDatabaseSeed` exists
2. Validate seed data structure
3. Check if version is already applied via localStorage
4. If needed, create DatabaseService with fake config or default
5. Clear existing data
6. Seed metadata and comments
7. Mark version as applied

**Returns**: `true` if seeding was performed, `false` if skipped.

**Usage**: Called during plugin initialization after DatabaseService initialization.

### Demo Data Structure

#### Expected Window Object Structure

```typescript
interface DemoDatabaseSeed {
  version: string;           // Version identifier for seeding control
  metadata: DocumentMetadata; // Single metadata object
  comments: CaptureComment[]; // Array of comment objects
}

// Expected on window object
window.demoDatabaseSeed = {
  version: 'demo-v1a',
  metadata: {
    documentTitle: 'Sample Document',
    documentRootUrl: 'http://localhost:3000/path',
    documentId: 'doc-001',
    reviewer: 'Demo User'
  },
  comments: [
    {
      id: 'comment-001',
      text: 'Sample feedback comment',
      pageUrl: 'http://localhost:3000/path/page.html',
      timestamp: '2024-01-01T12:00:00.000Z',
      location: '/html/body/div[1]/p[1]',
      snippet: 'Sample text content',
      author: 'Demo User'
    }
  ]
}
```

### Database Configuration Support

#### `getFakeDbConfig(): { dbName: string; dbVersion: number } | null`

**Purpose**: Extracts database configuration from `window.fakeData` for testing.

**Returns**: Database configuration object or null if not available.

**Usage**: Used internally to create DatabaseService with correct database name and version.

### Version Control Functions

#### `isVersionAlreadyApplied(version: string): boolean`

**Purpose**: Checks if a specific seed version has already been applied.

**Parameters**:
- `version`: Version string to check

**Returns**: `true` if version was previously applied, `false` otherwise.

**Storage**: Uses localStorage key `'backchannel-seed-version'`.

#### `markVersionAsApplied(version: string): void`

**Purpose**: Marks a seed version as applied in localStorage.

**Parameters**:
- `version`: Version string to mark as applied

### Utility Functions

#### `forceReseedDemoDatabase(): Promise<boolean>`

**Purpose**: Forces reseeding by clearing version flag and calling main seeding function.

**Usage**: For debugging and testing purposes.

#### `getCurrentSeedVersion(): string | null`

**Purpose**: Gets the currently applied seed version from localStorage.

**Returns**: Version string or null if no version applied.

#### `clearSeedVersion(): void`

**Purpose**: Clears the seed version flag from localStorage.

**Usage**: For debugging and testing scenarios.

## Integration Patterns

### Plugin Initialization Sequence

1. **Plugin Constructor**: Creates DatabaseService via `createDatabaseService()`
2. **Plugin.init()**: Calls `databaseService.initialize()`
3. **Demo Seeding**: Calls `seedDemoDatabaseIfNeeded()`
4. **Enabled Detection**: Calls `databaseService.isBackChannelEnabled()`
5. **UI Setup**: Proceeds with UI initialization

### Dependency Injection Pattern

DatabaseService is injected into components via property assignment:

```typescript
// In BackChannelPlugin.initializeUI()
this.icon.databaseService = this.databaseService;

// In BackChannelIcon.initializeModal()
this.packageModal.databaseService = this.databaseService;
```

### Error Handling Strategy

- **Database Errors**: Logged and re-thrown to prevent silent failures
- **Seeding Errors**: Caught and logged, but don't prevent plugin initialization
- **Cache Errors**: Logged as warnings, fall back to database queries

### Caching Strategy

- **Enabled State**: Cached in localStorage with URL-based invalidation
- **Database Info**: Basic database ID and URL root cached for performance
- **Version Control**: Seed versions tracked in localStorage to prevent re-seeding

## Testing Considerations

### Fake Data Support

Both modules support fake data for testing:
- **DatabaseService**: Accepts fake IndexedDB implementation
- **SeedDemoDatabase**: Uses `window.fakeData` for database configuration

### Test Data Structure

Test fixtures should provide both:
- `window.demoDatabaseSeed`: For seeding data
- `window.fakeData`: For database configuration (name, version)

## Performance Considerations

- **Lazy Database Operations**: Database only opened when needed
- **Efficient Caching**: LocalStorage caching reduces database queries
- **Batch Operations**: Comments seeded in efficient loop
- **Version Control**: Prevents unnecessary re-seeding

## Future Extensibility

The API is designed to support:
- **Multiple Database Versions**: Version-aware database upgrades
- **Custom Database Names**: Support for different database instances
- **Extended Metadata**: Additional document properties
- **Comment Management**: Update, delete, and search operations
- **Export Integration**: Direct integration with CSV export functionality