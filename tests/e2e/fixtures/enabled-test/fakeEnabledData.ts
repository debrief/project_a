/**
 * Fake database seed data for the enabled test fixture
 * This file declares the demo seed data directly in the correct format
 */

import type { DemoDatabaseSeed } from '../../../../src/utils/seedDemoDatabase'
import type { FakeDbStore } from '../../../../src/types'

/**
 * Demo seed data for the enabled test fixture
 * This is the actual data that will be seeded into the database
 */
export const enabledTestSeed: DemoDatabaseSeed = {
  version: 'demo-v1-enabled',
  metadata: {
    documentTitle: 'Enabled Test Package',
    documentRootUrl: '/tests/e2e/fixtures/enabled-test/enabled',
    documentId: 'pkg-1234567890',
    reviewer: 'Test Author 1',
  },
  comments: [
    {
      id: 'demo-comment-001',
      text: 'first para, root page',
      pageUrl: '/tests/e2e/fixtures/enabled-test/enabled/index.html',
      timestamp: '2025-01-07T16:12:28.258Z',
      location: '/html/body/p',
      snippet: 'This is the root page of the',
      author: 'Test Author 1',
    },
    {
      id: 'demo-comment-002',
      text: 'item two',
      pageUrl: '/tests/e2e/fixtures/enabled-test/enabled/subdir/index.html',
      timestamp: '2025-01-07T16:12:50.594Z',
      location: '/html/body/ul/li[2]',
      snippet: 'Item 2',
      author: 'Test Author 1',
    },
    {
      id: 'demo-comment-003',
      text: 'feedback on the flow diagram',
      pageUrl: '/tests/e2e/fixtures/enabled-test/enabled/index.html',
      timestamp: '2025-01-07T16:36:43.910Z',
      location: '/html/body/img',
      snippet: '',
      author: 'Test Author 1',
    },
    {
      id: 'demo-comment-004',
      text: 'feedback on last paragraph',
      pageUrl: '/tests/e2e/fixtures/enabled-test/enabled/index.html',
      timestamp: '2025-01-07T16:36:54.621Z',
      location: '/html/body/p[6]',
      snippet: 'Collaborative feedback process',
      author: 'Test Author 1',
    },
  ],
}

/**
 * Generate FakeDbStore structure from the demo seed data
 * This is used for database configuration (name and version)
 */
export const fakeData: FakeDbStore = {
  version: 1,
  databases: [
    {
      name: 'BackChannelDB-EnabledTest',
      version: 1,
      objectStores: [
        {
          name: 'metadata',
          keyPath: 'documentRootUrl',
          data: [enabledTestSeed.metadata],
        },
        {
          name: 'comments',
          keyPath: 'id',
          data: enabledTestSeed.comments,
        },
      ],
    },
  ],
}

// Make data available on the window object
if (typeof window !== 'undefined') {
  // Set the demo seed data directly
  Object.defineProperty(window, 'demoDatabaseSeed', {
    value: enabledTestSeed,
    writable: true,
    enumerable: true,
    configurable: true,
  });

  // Also keep the raw fakeData available for database configuration
  Object.defineProperty(window, 'fakeData', {
    value: fakeData,
    writable: true,
    enumerable: true,
    configurable: true,
  });

  console.log('fake data set on window object');
}
