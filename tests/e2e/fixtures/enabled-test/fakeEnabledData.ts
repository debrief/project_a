/**
 * Fake database definitions for the enabled test fixture
 * This file exports an array of typed JSON objects that will be converted
 * into IDBDatabase instances using fake-indexeddb
 */

import type { FakeDbStore } from '../../../../src/types'

/**
 * Fake database definitions for the enabled test fixture
 * Each database definition includes:
 * - name: The name of the database
 * - version: The version of the database
 * - objectStores: Array of object stores with their data
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
          data: [
            {
              documentTitle: 'Enabled Test Package',
              documentRootUrl: 'http://localhost:3000/tests/e2e/fixtures/enabled-test/enabled',
              documentId: 'pkg-1234567890',
              reviewer: 'Test Author 1',
            },
          ],
        },
        {
          name: 'comments',
          keyPath: 'id',
          data: [
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
        },
      ],
    },
  ],
}

// Make fakeData available on the window object as demo seed data
if (typeof window !== 'undefined') {
  // Format as demo seed data that the seeding utility expects
  const demoSeedData = {
    version: 'demo-v1',
    metadata: fakeData.databases[0].objectStores.find(store => store.name === 'metadata')?.data[0],
    comments: fakeData.databases[0].objectStores.find(store => store.name === 'comments')?.data || [],
  };

  Object.defineProperty(window, 'demoDatabaseSeed', {
    value: demoSeedData,
    writable: true,
    enumerable: true,
    configurable: true,
  });

  // Also keep the raw fakeData available for testing purposes
  Object.defineProperty(window, 'fakeData', {
    value: fakeData,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}
