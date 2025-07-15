/**
 * @fileoverview DatabaseService - IndexedDB wrapper for BackChannel data persistence
 * @version 1.0.0
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
const DB_NAME = 'BackChannelDB';
const DB_VERSION = 1;
const COMMENTS_STORE = 'comments';
const METADATA_STORE = 'metadata';

/**
 * localStorage keys for caching
 */
const CACHE_KEYS = {
  DATABASE_ID: 'backchannel-db-id',
  DOCUMENT_URL_ROOT: 'backchannel-url-root',
  SEED_VERSION: 'backchannel-seed-version',
  ENABLED_STATE: 'backchannel-enabled-state',
  LAST_URL_CHECK: 'backchannel-last-url-check',
} as const;

/**
 * DatabaseService provides IndexedDB operations for BackChannel feedback data
 * Implements minimal localStorage caching of database id and document URL root
 */
export class DatabaseService implements StorageInterface {
  private db: IDBDatabase | null = null;
  private readonly fakeIndexedDb?: IDBFactory;
  private isInitialized = false;

  /**
   * @param fakeIndexedDb Optional fake IndexedDB implementation for testing
   */
  constructor(fakeIndexedDb?: IDBFactory) {
    this.fakeIndexedDb = fakeIndexedDb;
  }

  /**
   * Initialize the database connection
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
   * Open IndexedDB database with proper schema setup
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const indexedDB = this.fakeIndexedDb || window.indexedDB;

      if (!indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

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
   * Set up database schema with object stores
   */
  private setupDatabase(db: IDBDatabase): void {
    try {
      // Comments object store
      if (!db.objectStoreNames.contains(COMMENTS_STORE)) {
        const commentsStore = db.createObjectStore(COMMENTS_STORE, {
          keyPath: 'id',
        });
        commentsStore.createIndex('pageUrl', 'pageUrl', { unique: false });
        commentsStore.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('Comments store created');
      }

      // Metadata object store
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, {
          keyPath: 'documentRootUrl',
        });
        console.log('Metadata store created');
      }

      console.log('Database schema setup completed');
    } catch (error) {
      console.error('Error setting up database schema:', error);
      throw error;
    }
  }

  /**
   * Cache basic information to localStorage for quick access
   */
  private cacheBasicInfo(): void {
    try {
      const dbId = `${DB_NAME}_v${DB_VERSION}`;
      const urlRoot = this.getDocumentUrlRoot();

      localStorage.setItem(CACHE_KEYS.DATABASE_ID, dbId);
      localStorage.setItem(CACHE_KEYS.DOCUMENT_URL_ROOT, urlRoot);

      console.log('Basic info cached to localStorage');
    } catch (error) {
      console.warn('Failed to cache basic info to localStorage:', error);
    }
  }

  /**
   * Check if BackChannel should be enabled for the current page
   * Uses localStorage cache first, then falls back to database scan
   */
  async isBackChannelEnabled(): Promise<boolean> {
    try {
      const currentUrl = this.getCurrentPageUrl();
      const cachedEnabledState = localStorage.getItem(CACHE_KEYS.ENABLED_STATE);
      const cachedUrlRoot = localStorage.getItem(CACHE_KEYS.DOCUMENT_URL_ROOT);
      const lastUrlCheck = localStorage.getItem(CACHE_KEYS.LAST_URL_CHECK);

      // Fast path: check if cache is valid for current URL
      if (cachedEnabledState !== null && cachedUrlRoot && lastUrlCheck) {
        const lastCheckTime = parseInt(lastUrlCheck, 10);
        const cacheAge = Date.now() - lastCheckTime;
        const cacheValidDuration = 5 * 60 * 1000; // 5 minutes

        if (
          cacheAge < cacheValidDuration &&
          currentUrl.startsWith(cachedUrlRoot)
        ) {
          console.log(
            'BackChannel enabled state from cache:',
            cachedEnabledState === 'true'
          );
          return cachedEnabledState === 'true';
        }
      }

      // Slow path: scan database for matching URL root
      const enabled = await this.scanDatabaseForUrlMatch(currentUrl);

      // Update cache
      if (enabled) {
        const metadata = await this.getMetadata();
        if (metadata) {
          localStorage.setItem(CACHE_KEYS.ENABLED_STATE, 'true');
          localStorage.setItem(
            CACHE_KEYS.DOCUMENT_URL_ROOT,
            metadata.documentRootUrl
          );
          localStorage.setItem(
            CACHE_KEYS.LAST_URL_CHECK,
            Date.now().toString()
          );
        }
      } else {
        localStorage.setItem(CACHE_KEYS.ENABLED_STATE, 'false');
        localStorage.setItem(CACHE_KEYS.LAST_URL_CHECK, Date.now().toString());
      }

      console.log('BackChannel enabled state determined:', enabled);
      return enabled;
    } catch (error) {
      console.error('Error determining BackChannel enabled state:', error);
      return false;
    }
  }

  /**
   * Scan all metadata entries in the database to find a matching URL root
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
        console.log('this root is', metadata, metadata);
        if (currentUrl.startsWith(metadata.documentRootUrl)) {
          console.log('Found matching URL root:', metadata.documentRootUrl);
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
   * Get the current page URL
   */
  private getCurrentPageUrl(): string {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.href;
    }
    return '';
  }

  /**
   * Clear the enabled state cache
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
   * Get document URL root from current location
   */
  private getDocumentUrlRoot(): string {
    if (typeof window !== 'undefined' && window.location) {
      const url = new URL(window.location.href);
      return `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}`;
    }
    return 'file://';
  }

  /**
   * Check if page already has feedback based on cached info
   */
  hasExistingFeedback(): boolean {
    try {
      const cachedDbId = localStorage.getItem(CACHE_KEYS.DATABASE_ID);
      const cachedUrlRoot = localStorage.getItem(CACHE_KEYS.DOCUMENT_URL_ROOT);
      const currentUrlRoot = this.getDocumentUrlRoot();

      return cachedDbId !== null && cachedUrlRoot === currentUrlRoot;
    } catch (error) {
      console.warn('Failed to check existing feedback:', error);
      return false;
    }
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized || !this.db) {
      await this.initialize();
    }
  }

  /**
   * Execute a transaction with proper error handling
   */
  private executeTransaction<T>(
    storeNames: string | string[],
    mode: IDBTransactionMode,
    operation: (transaction: IDBTransaction) => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.ensureInitialized()
        .then(() => {
          if (!this.db) {
            reject(new Error('Database not available'));
            return;
          }

          try {
            const transaction = this.db.transaction(storeNames, mode);

            transaction.onerror = () => {
              console.error('Transaction error:', transaction.error);
              reject(transaction.error);
            };

            transaction.onabort = () => {
              console.error('Transaction aborted');
              reject(new Error('Transaction aborted'));
            };

            operation(transaction)
              .then(result => resolve(result))
              .catch(error => reject(error));
          } catch (error) {
            console.error('Transaction execution error:', error);
            reject(error);
          }
        })
        .catch(error => reject(error));
    });
  }

  /**
   * Get document metadata from storage
   */
  async getMetadata(): Promise<DocumentMetadata | null> {
    return this.executeTransaction(
      METADATA_STORE,
      'readonly',
      async transaction => {
        const store = transaction.objectStore(METADATA_STORE);
        const urlRoot = this.getDocumentUrlRoot();

        return new Promise<DocumentMetadata | null>((resolve, reject) => {
          const request = store.get(urlRoot);

          request.onsuccess = () => {
            const result = request.result;
            console.log('Metadata retrieved:', result ? 'found' : 'not found');
            resolve(result || null);
          };

          request.onerror = () => {
            console.error('Failed to get metadata:', request.error);
            reject(request.error);
          };
        });
      }
    );
  }

  /**
   * Set document metadata in storage
   */
  async setMetadata(metadata: DocumentMetadata): Promise<void> {
    return this.executeTransaction(
      METADATA_STORE,
      'readwrite',
      async transaction => {
        const store = transaction.objectStore(METADATA_STORE);

        return new Promise<void>((resolve, reject) => {
          const request = store.put(metadata);

          request.onsuccess = () => {
            console.log('Metadata saved successfully');
            resolve();
          };

          request.onerror = () => {
            console.error('Failed to save metadata:', request.error);
            reject(request.error);
          };
        });
      }
    );
  }

  /**
   * Get all comments from storage
   */
  async getComments(): Promise<CaptureComment[]> {
    return this.executeTransaction(
      COMMENTS_STORE,
      'readonly',
      async transaction => {
        const store = transaction.objectStore(COMMENTS_STORE);

        return new Promise<CaptureComment[]>((resolve, reject) => {
          const request = store.getAll();

          request.onsuccess = () => {
            const comments = request.result.filter(isCaptureComment);
            console.log(`Retrieved ${comments.length} comments from storage`);
            resolve(comments);
          };

          request.onerror = () => {
            console.error('Failed to get comments:', request.error);
            reject(request.error);
          };
        });
      }
    );
  }

  /**
   * Add a new comment to storage
   */
  async addComment(comment: CaptureComment): Promise<void> {
    if (!isCaptureComment(comment)) {
      throw new Error('Invalid comment format');
    }

    return this.executeTransaction(
      COMMENTS_STORE,
      'readwrite',
      async transaction => {
        const store = transaction.objectStore(COMMENTS_STORE);

        return new Promise<void>((resolve, reject) => {
          const request = store.add(comment);

          request.onsuccess = () => {
            console.log(`Comment added successfully: ${comment.id}`);
            resolve();
          };

          request.onerror = () => {
            console.error('Failed to add comment:', request.error);
            reject(request.error);
          };
        });
      }
    );
  }

  /**
   * Update an existing comment in storage
   */
  async updateComment(
    id: string,
    updates: Partial<CaptureComment>
  ): Promise<void> {
    return this.executeTransaction(
      COMMENTS_STORE,
      'readwrite',
      async transaction => {
        const store = transaction.objectStore(COMMENTS_STORE);

        return new Promise<void>((resolve, reject) => {
          const getRequest = store.get(id);

          getRequest.onsuccess = () => {
            const existingComment = getRequest.result;

            if (!existingComment) {
              reject(new Error(`Comment with id ${id} not found`));
              return;
            }

            const updatedComment = { ...existingComment, ...updates };

            if (!isCaptureComment(updatedComment)) {
              reject(new Error('Updated comment format is invalid'));
              return;
            }

            const putRequest = store.put(updatedComment);

            putRequest.onsuccess = () => {
              console.log(`Comment updated successfully: ${id}`);
              resolve();
            };

            putRequest.onerror = () => {
              console.error('Failed to update comment:', putRequest.error);
              reject(putRequest.error);
            };
          };

          getRequest.onerror = () => {
            console.error(
              'Failed to get comment for update:',
              getRequest.error
            );
            reject(getRequest.error);
          };
        });
      }
    );
  }

  /**
   * Delete a comment from storage
   */
  async deleteComment(id: string): Promise<void> {
    return this.executeTransaction(
      COMMENTS_STORE,
      'readwrite',
      async transaction => {
        const store = transaction.objectStore(COMMENTS_STORE);

        return new Promise<void>((resolve, reject) => {
          const request = store.delete(id);

          request.onsuccess = () => {
            console.log(`Comment deleted successfully: ${id}`);
            resolve();
          };

          request.onerror = () => {
            console.error('Failed to delete comment:', request.error);
            reject(request.error);
          };
        });
      }
    );
  }

  /**
   * Clear all data from storage
   */
  async clear(): Promise<void> {
    return this.executeTransaction(
      [COMMENTS_STORE, METADATA_STORE],
      'readwrite',
      async transaction => {
        const commentsStore = transaction.objectStore(COMMENTS_STORE);
        const metadataStore = transaction.objectStore(METADATA_STORE);

        return new Promise<void>((resolve, reject) => {
          let completedOperations = 0;
          const totalOperations = 2;

          const checkComplete = () => {
            completedOperations++;
            if (completedOperations === totalOperations) {
              console.log('All data cleared successfully');
              // Clear localStorage cache as well
              try {
                localStorage.removeItem(CACHE_KEYS.DATABASE_ID);
                localStorage.removeItem(CACHE_KEYS.DOCUMENT_URL_ROOT);
                localStorage.removeItem(CACHE_KEYS.SEED_VERSION);
                localStorage.removeItem(CACHE_KEYS.ENABLED_STATE);
                localStorage.removeItem(CACHE_KEYS.LAST_URL_CHECK);
              } catch (error) {
                console.warn('Failed to clear localStorage cache:', error);
              }
              resolve();
            }
          };

          const commentsRequest = commentsStore.clear();
          commentsRequest.onsuccess = checkComplete;
          commentsRequest.onerror = () => {
            console.error('Failed to clear comments:', commentsRequest.error);
            reject(commentsRequest.error);
          };

          const metadataRequest = metadataStore.clear();
          metadataRequest.onsuccess = checkComplete;
          metadataRequest.onerror = () => {
            console.error('Failed to clear metadata:', metadataRequest.error);
            reject(metadataRequest.error);
          };
        });
      }
    );
  }
}
