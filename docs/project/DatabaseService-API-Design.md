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

**Note**: The `clear()` method is not included in this API design. Database clearing is handled by the seeding process through database deletion and recreation, which provides a cleaner and more reliable approach.

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
4. If needed, delete existing database completely
5. Create fresh DatabaseService with fake config or default
6. Initialize new database
7. Seed metadata and comments
8. Mark version as applied

**Returns**: `true` if seeding was performed, `false` if skipped.

**Usage**: Called during plugin initialization after DatabaseService initialization.

**Database Recreation Approach**: Instead of clearing data from an existing database, the seeding process deletes the entire database and creates a fresh one. This ensures a completely clean state and handles any potential schema changes or corruption issues.

#### Detailed Seeding Process Flow

```typescript
async function seedDemoDatabaseIfNeeded(): Promise<boolean> {
  console.log('Checking if demo database seeding is needed...');

  // Step 1: Check if demo seed is available
  const demoSeed = getDemoSeed();
  if (!demoSeed) {
    console.log('No demo seed found in window.demoDatabaseSeed');
    return false;
  }

  // Step 2: Check if version is already applied
  if (isVersionAlreadyApplied(demoSeed.version)) {
    console.log(`Demo seed version ${demoSeed.version} already applied, skipping seeding`);
    return false;
  }

  // Step 3: Get database configuration
  const fakeDbConfig = getFakeDbConfig();
  const dbName = fakeDbConfig?.dbName || 'BackChannelDB';
  const dbVersion = fakeDbConfig?.dbVersion || 1;

  // Step 4: Delete existing database
  await deleteDatabase(dbName);

  // Step 5: Create fresh database service
  const dbService = new DatabaseService(undefined, dbName, dbVersion);
  await dbService.initialize();

  // Step 6: Seed metadata
  await dbService.setMetadata(demoSeed.metadata);
  console.log('Demo metadata seeded successfully');

  // Step 7: Seed comments
  for (const comment of demoSeed.comments) {
    await dbService.addComment(comment);
  }
  console.log(`${demoSeed.comments.length} demo comments seeded successfully`);

  // Step 8: Mark version as applied
  markVersionAsApplied(demoSeed.version);
  console.log(`Demo database seeding completed for version ${demoSeed.version}`);
  
  return true;
}
```

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

### Database Management Functions

#### `deleteDatabase(dbName: string): Promise<void>`

**Purpose**: Completely deletes an IndexedDB database.

**Parameters**:
- `dbName`: Name of the database to delete

**Behavior**:
- Uses `indexedDB.deleteDatabase()` to remove the entire database
- Handles success, error, and blocked scenarios
- Provides clean slate for database recreation

**Implementation**:
```typescript
async function deleteDatabase(dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(dbName);
    
    deleteRequest.onsuccess = () => {
      console.log(`Database ${dbName} deleted successfully`);
      resolve();
    };
    
    deleteRequest.onerror = () => {
      console.error(`Failed to delete database ${dbName}:`, deleteRequest.error);
      reject(deleteRequest.error);
    };
    
    deleteRequest.onblocked = () => {
      console.warn(`Database ${dbName} deletion blocked - close other tabs`);
      // Could add timeout here if needed
    };
  });
}
```

**Usage**: Called internally by seeding process before creating fresh database.

#### `getDemoSeed(): DemoDatabaseSeed | null`

**Purpose**: Validates and retrieves demo seed data from `window.demoDatabaseSeed`.

**Returns**: Validated demo seed data or null if not available or invalid.

**Validation**:
- Checks if `window.demoDatabaseSeed` exists
- Validates version is a string
- Validates metadata is an object
- Validates comments is an array
- Validates each comment using `isCaptureComment()` type guard

**Usage**: Called at start of seeding process to get demo data.

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

**Implementation**:
```typescript
function isVersionAlreadyApplied(version: string): boolean {
  try {
    const appliedVersion = localStorage.getItem(SEED_VERSION_KEY);
    return appliedVersion === version;
  } catch (error) {
    console.warn('Failed to check applied seed version:', error);
    return false;
  }
}
```

**Storage**: Uses localStorage key `'backchannel-seed-version'`.

#### `markVersionAsApplied(version: string): void`

**Purpose**: Marks a seed version as applied in localStorage.

**Parameters**:
- `version`: Version string to mark as applied

**Implementation**:
```typescript
function markVersionAsApplied(version: string): void {
  try {
    localStorage.setItem(SEED_VERSION_KEY, version);
    console.log(`Seed version ${version} marked as applied`);
  } catch (error) {
    console.warn('Failed to mark seed version as applied:', error);
  }
}
```

### Utility Functions

#### `forceReseedDemoDatabase(): Promise<boolean>`

**Purpose**: Forces reseeding by clearing version flag and calling main seeding function.

**Implementation**:
```typescript
export async function forceReseedDemoDatabase(): Promise<boolean> {
  console.log('Force reseeding demo database...');
  
  // Clear the version flag
  try {
    localStorage.removeItem(SEED_VERSION_KEY);
  } catch (error) {
    console.warn('Failed to clear seed version flag:', error);
  }
  
  // Perform seeding
  return await seedDemoDatabaseIfNeeded();
}
```

**Usage**: For debugging and testing purposes.

#### `getCurrentSeedVersion(): string | null`

**Purpose**: Gets the currently applied seed version from localStorage.

**Returns**: Version string or null if no version applied.

**Implementation**:
```typescript
export function getCurrentSeedVersion(): string | null {
  try {
    return localStorage.getItem(SEED_VERSION_KEY);
  } catch (error) {
    console.warn('Failed to get current seed version:', error);
    return null;
  }
}
```

#### `clearSeedVersion(): void`

**Purpose**: Clears the seed version flag from localStorage.

**Implementation**:
```typescript
export function clearSeedVersion(): void {
  try {
    localStorage.removeItem(SEED_VERSION_KEY);
    console.log('Seed version flag cleared');
  } catch (error) {
    console.warn('Failed to clear seed version flag:', error);
  }
}
```

**Usage**: For debugging and testing scenarios.

## Integration Patterns

### Plugin Initialization Sequence

1. **Plugin Constructor**: Creates DatabaseService via `createDatabaseService()`
2. **Plugin.init()**: Calls `databaseService.initialize()`
3. **Demo Seeding**: Calls `seedDemoDatabaseIfNeeded()` which may delete and recreate the database
4. **Enabled Detection**: Calls `databaseService.isBackChannelEnabled()`
5. **UI Setup**: Proceeds with UI initialization

**Note**: The seeding process may delete and recreate the database, so any DatabaseService instances created before seeding should be reinitialized or recreated after seeding completes.

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
- **Database Deletion Errors**: Logged but don't prevent seeding (database may not exist)
- **Cache Errors**: Logged as warnings, fall back to database queries

### Caching Strategy

- **Enabled State**: Cached in localStorage with URL-based invalidation
- **Database Info**: Basic database ID and URL root cached for performance
- **Version Control**: Seed versions tracked in localStorage to prevent re-seeding
- **Database Recreation**: Cache invalidation handled automatically when database is deleted and recreated

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
- **Database Recreation**: Complete database deletion and recreation is faster than clearing large amounts of data
- **Clean State**: Fresh database eliminates fragmentation and ensures optimal performance

## Future Extensibility

The API is designed to support:
- **Multiple Database Versions**: Version-aware database upgrades
- **Custom Database Names**: Support for different database instances
- **Extended Metadata**: Additional document properties
- **Comment Management**: Update, delete, and search operations
- **Export Integration**: Direct integration with CSV export functionality