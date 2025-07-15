/**
 * @fileoverview DatabaseService - IndexedDB wrapper for BackChannel data persistence
 * @version 2.0.0
 * @author BackChannel Team
 */

import {
  CaptureComment,
  DocumentMetadata,
  StorageInterface,
  isCaptureComment,
} from '../types';

/**
 * Database configuration constants
 */
const DEFAULT_DB_NAME = 'BackChannelDB';
const DEFAULT_DB_VERSION = 1;
const COMMENTS_STORE = 'comments';
const METADATA_STORE = 'metadata';

/**
 * localStorage keys for caching
 */
const CACHE_KEYS = {
  DATABASE_ID: 'backchannel-db-id',
  DOCUMENT_URL_ROOT: 'backchannel-url-root',
  ENABLED_STATE: 'backchannel-enabled-state',
  LAST_URL_CHECK: 'backchannel-last-url-check',
} as const;

/**
 * DatabaseService provides IndexedDB operations for BackChannel feedback data
 * Implements minimal localStorage caching for performance optimization
 */
export class DatabaseService implements StorageInterface {
  private db: IDBDatabase | null = null;
  private readonly fakeIndexedDb?: IDBFactory;
  private isInitialized = false;
  private readonly dbName: string;
  private readonly dbVersion: number;

  /**
   * Creates a new DatabaseService instance with optional configuration
   * @param fakeIndexedDb Optional mock IndexedDB implementation for testing
   * @param dbName Optional database name (defaults to 'BackChannelDB')
   * @param dbVersion Optional database version (defaults to 1)
   */
  constructor(fakeIndexedDb?: IDBFactory, dbName?: string, dbVersion?: number) {
    this.fakeIndexedDb = fakeIndexedDb;
    this.dbName = dbName || DEFAULT_DB_NAME;
    this.dbVersion = dbVersion || DEFAULT_DB_VERSION;
  }

  /**
   * Initializes the IndexedDB database connection and sets up object stores
   * @throws Error if IndexedDB is not supported or database cannot be opened
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    try {
      this.db = await this.openDatabase();
      this.isInitialized = true;
      this.cacheBasicInfo();
      console.log('DatabaseService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DatabaseService:', error);
      throw error;
    }
  }

  /**
   * Opens IndexedDB database with proper schema setup
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const indexedDB = this.fakeIndexedDb || window.indexedDB;

      if (!indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Database open error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('Database opened successfully');
        resolve(request.result);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        console.log('Database upgrade needed');
        const db = (event.target as IDBOpenDBRequest).result;
        this.setupDatabase(db);
      };
    });
  }

  /**
   * Sets up database schema with object stores
   */
  private setupDatabase(db: IDBDatabase): void {
    console.log('Setting up database schema');

    // Create metadata store
    if (!db.objectStoreNames.contains(METADATA_STORE)) {
      db.createObjectStore(METADATA_STORE, {
        keyPath: 'documentRootUrl',
      });
      console.log('Created metadata object store');
    }

    // Create comments store
    if (!db.objectStoreNames.contains(COMMENTS_STORE)) {
      db.createObjectStore(COMMENTS_STORE, {
        keyPath: 'id',
      });
      console.log('Created comments object store');
    }
  }

  /**
   * Caches basic information to localStorage for quick access
   */
  private cacheBasicInfo(): void {
    try {
      const dbId = `${this.dbName}_v${this.dbVersion}`;
      const urlRoot = this.getDocumentUrlRoot();

      localStorage.setItem(CACHE_KEYS.DATABASE_ID, dbId);
      localStorage.setItem(CACHE_KEYS.DOCUMENT_URL_ROOT, urlRoot);

      console.log('Basic info cached to localStorage');
    } catch (error) {
      console.warn('Failed to cache basic info to localStorage:', error);
    }
  }

  /**
   * Retrieves document metadata from the database
   * @returns DocumentMetadata object or null if no metadata exists
   */
  async getMetadata(): Promise<DocumentMetadata | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return this.executeTransaction(
      [METADATA_STORE],
      'readonly',
      async transaction => {
        const store = transaction.objectStore(METADATA_STORE);
        return new Promise<DocumentMetadata | null>((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => {
            const results = request.result;
            resolve(results.length > 0 ? results[0] : null);
          };
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * Stores document metadata in the database
   * @param metadata Document metadata object containing title, URL root, ID, and reviewer
   */
  async setMetadata(metadata: DocumentMetadata): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return this.executeTransaction(
      [METADATA_STORE],
      'readwrite',
      async transaction => {
        const store = transaction.objectStore(METADATA_STORE);
        return new Promise<void>((resolve, reject) => {
          const request = store.put(metadata);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * Retrieves all comments from the database
   * @returns Array of CaptureComment objects
   */
  async getComments(): Promise<CaptureComment[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return this.executeTransaction(
      [COMMENTS_STORE],
      'readonly',
      async transaction => {
        const store = transaction.objectStore(COMMENTS_STORE);
        return new Promise<CaptureComment[]>((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => {
            const results = request.result || [];
            resolve(results.filter(isCaptureComment));
          };
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * Adds a new comment to the database
   * @param comment Complete comment object with ID, text, location, timestamp, etc.
   */
  async addComment(comment: CaptureComment): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return this.executeTransaction(
      [COMMENTS_STORE],
      'readwrite',
      async transaction => {
        const store = transaction.objectStore(COMMENTS_STORE);
        return new Promise<void>((resolve, reject) => {
          const request = store.add(comment);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * Updates an existing comment in the database
   * @param id Comment ID to update
   * @param updates Partial comment object with fields to update
   */
  async updateComment(
    id: string,
    updates: Partial<CaptureComment>
  ): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return this.executeTransaction(
      [COMMENTS_STORE],
      'readwrite',
      async transaction => {
        const store = transaction.objectStore(COMMENTS_STORE);
        return new Promise<void>((resolve, reject) => {
          const getRequest = store.get(id);
          getRequest.onsuccess = () => {
            const existingComment = getRequest.result;
            if (!existingComment) {
              reject(new Error(`Comment with ID ${id} not found`));
              return;
            }

            const updatedComment = { ...existingComment, ...updates };
            const putRequest = store.put(updatedComment);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
          };
          getRequest.onerror = () => reject(getRequest.error);
        });
      }
    );
  }

  /**
   * Deletes a comment from the database
   * @param id Comment ID to delete
   */
  async deleteComment(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return this.executeTransaction(
      [COMMENTS_STORE],
      'readwrite',
      async transaction => {
        const store = transaction.objectStore(COMMENTS_STORE);
        return new Promise<void>((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * Determines if BackChannel should be enabled for the current page
   * Uses localStorage caching for performance with URL-based invalidation
   * @returns true if current URL matches any stored document root URL
   */
  async isBackChannelEnabled(): Promise<boolean> {
    const currentUrl = this.getCurrentPageUrl();

    // Fast path: check localStorage cache
    try {
      const cachedEnabledState = localStorage.getItem(CACHE_KEYS.ENABLED_STATE);
      const lastUrlCheck = localStorage.getItem(CACHE_KEYS.LAST_URL_CHECK);

      if (cachedEnabledState !== null && lastUrlCheck === currentUrl) {
        console.log(
          'Using cached enabled state:',
          cachedEnabledState === 'true'
        );
        return cachedEnabledState === 'true';
      }
    } catch (error) {
      console.warn('Failed to check cached enabled state:', error);
    }

    // Slow path: scan database for URL matches
    const isEnabled = await this.scanDatabaseForUrlMatch(currentUrl);

    // Cache the result
    try {
      localStorage.setItem(CACHE_KEYS.ENABLED_STATE, isEnabled.toString());
      localStorage.setItem(CACHE_KEYS.LAST_URL_CHECK, currentUrl);
    } catch (error) {
      console.warn('Failed to cache enabled state:', error);
    }

    return isEnabled;
  }

  /**
   * Scans database for URL matches to determine enabled state
   */
  private async scanDatabaseForUrlMatch(currentUrl: string): Promise<boolean> {
    if (!this.db) {
      console.warn('Database not initialized for URL scan');
      return false;
    }

    try {
      const allMetadata = await this.executeTransaction(
        [METADATA_STORE],
        'readonly',
        async transaction => {
          const store = transaction.objectStore(METADATA_STORE);
          return new Promise<DocumentMetadata[]>((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
              const results = request.result || [];
              resolve(results);
            };
            request.onerror = () => reject(request.error);
          });
        }
      );

      // Check if any metadata entry has a URL root that matches the current URL
      for (const metadata of allMetadata) {
        if (this.urlPathMatches(currentUrl, metadata.documentRootUrl)) {
          console.log('Found matching URL pattern:', metadata.documentRootUrl);
          return true;
        }
      }

      console.log('No matching URL root found in database');
      return false;
    } catch (error) {
      console.error('Error scanning database for URL match:', error);
      return false;
    }
  }

  /**
   * Clears the cached enabled state to force re-evaluation
   * Called after successful package creation to ensure enabled state reflects new data
   */
  clearEnabledStateCache(): void {
    try {
      localStorage.removeItem(CACHE_KEYS.ENABLED_STATE);
      localStorage.removeItem(CACHE_KEYS.LAST_URL_CHECK);
      console.log('Enabled state cache cleared');
    } catch (error) {
      console.warn('Failed to clear enabled state cache:', error);
    }
  }

  /**
   * Gets the current page URL for enabled/disabled detection
   * @returns Current window location as string
   */
  getCurrentPageUrl(): string {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.href;
    }
    return '';
  }

  /**
   * Checks if a current URL matches a document root URL pattern
   * Uses flexible path-based matching that ignores protocol, host, and port differences
   * @param currentUrl The current page URL
   * @param documentRootUrl The pattern URL from the feedback package
   * @returns true if the current URL path contains the document root path
   */
  private urlPathMatches(currentUrl: string, documentRootUrl: string): boolean {
    try {
      // Handle special case for file:// protocol patterns
      if (documentRootUrl === 'file://' || documentRootUrl === 'file:///') {
        const matches = currentUrl.startsWith('file://');
        console.log(
          `File protocol matching: "${currentUrl}" starts with "file://" = ${matches}`
        );
        return matches;
      }

      // Handle cases where documentRootUrl might be a simple path
      let patternPath: string;
      if (
        documentRootUrl.startsWith('http://') ||
        documentRootUrl.startsWith('https://') ||
        documentRootUrl.startsWith('file://')
      ) {
        // Full URL - extract just the path
        const patternUrl = new URL(documentRootUrl);
        patternPath = patternUrl.pathname;
      } else if (documentRootUrl.startsWith('/')) {
        // Already a path
        patternPath = documentRootUrl;
      } else {
        // Relative path - treat as a path component
        patternPath = '/' + documentRootUrl;
      }

      // Extract path from current URL
      const currentUrlObj = new URL(currentUrl);
      const currentPath = currentUrlObj.pathname;

      // Check if current path contains the pattern path
      const matches = currentPath.includes(patternPath);

      console.log(
        `URL path matching: "${currentPath}" contains "${patternPath}" = ${matches}`
      );
      return matches;
    } catch (error) {
      console.warn('URL parsing error in urlPathMatches:', error);
      // Fallback to simple string containment
      const matches = currentUrl.includes(documentRootUrl);
      console.log(
        `Fallback string matching: "${currentUrl}" contains "${documentRootUrl}" = ${matches}`
      );
      return matches;
    }
  }

  /**
   * Extracts document root URL from current page for caching
   * @returns Base URL path for document identification
   */
  private getDocumentUrlRoot(): string {
    if (typeof window !== 'undefined' && window.location) {
      const url = new URL(window.location.href);
      return `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}${url.pathname}`;
    }
    return '';
  }

  /**
   * Closes the database connection and resets initialization state
   * Must be called before attempting to delete the database
   */
  close(): void {
    if (this.db) {
      console.log('Closing database connection');
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  /**
   * Gets the current database name for external operations
   */
  getDatabaseName(): string {
    return this.dbName;
  }

  /**
   * Gets the current database version for external operations
   */
  getDatabaseVersion(): number {
    return this.dbVersion;
  }

  /**
   * Executes a database transaction with error handling
   */
  private executeTransaction<T>(
    storeNames: string[],
    mode: IDBTransactionMode,
    operation: (transaction: IDBTransaction) => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(storeNames, mode);

      transaction.oncomplete = () => {
        // Transaction completed successfully
      };

      transaction.onerror = () => {
        console.error('Transaction error:', transaction.error);
        reject(transaction.error);
      };

      transaction.onabort = () => {
        console.error('Transaction aborted');
        reject(new Error('Transaction aborted'));
      };

      try {
        operation(transaction).then(resolve).catch(reject);
      } catch (error) {
        console.error('Transaction execution error:', error);
        reject(error);
      }
    });
  }
}
