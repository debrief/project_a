/**
 * @fileoverview Sample fake data for demo database seeding
 * @version 1.0.0
 * @author BackChannel Team
 */

import { DemoDatabaseSeed } from '../../../src/utils/seedDemoDatabase';

/**
 * Sample demo database seed data
 * This structure should be injected into window.demoDatabaseSeed
 */
export const sampleDemoSeed: DemoDatabaseSeed = {
  version: 'demo-v1',
  metadata: {
    documentTitle: 'Sample Document for Testing',
    documentRootUrl: 'file://',
    documentId: 'test-doc-001',
    reviewer: 'Test User'
  },
  comments: [
    {
      id: 'comment-001',
      text: 'This is a sample feedback comment for testing purposes.',
      pageUrl: 'file:///test-page.html',
      timestamp: '2024-01-01T12:00:00.000Z',
      location: '/html/body/div[1]/p[1]',
      snippet: 'Sample text content',
      author: 'TestUser'
    },
    {
      id: 'comment-002',
      text: 'Another test comment to verify multiple comments work.',
      pageUrl: 'file:///test-page.html',
      timestamp: '2024-01-01T12:05:00.000Z',
      location: '/html/body/div[1]/p[2]',
      snippet: 'More sample content',
      author: 'TestUser'
    },
    {
      id: 'comment-003',
      text: 'This comment has no author or snippet to test optional fields.',
      pageUrl: 'file:///test-page.html',
      timestamp: '2024-01-01T12:10:00.000Z',
      location: '/html/body/div[2]/h1[1]'
    }
  ]
};

/**
 * Function to inject demo seed into window object
 * This simulates what would happen in a real demo page
 */
export function injectDemoSeed(): void {
  if (typeof window !== 'undefined') {
    window.demoDatabaseSeed = sampleDemoSeed;
    console.log('Demo seed injected into window.demoDatabaseSeed');
  }
}

/**
 * Function to clear demo seed from window object
 */
export function clearDemoSeed(): void {
  if (typeof window !== 'undefined') {
    delete window.demoDatabaseSeed;
    console.log('Demo seed cleared from window.demoDatabaseSeed');
  }
}