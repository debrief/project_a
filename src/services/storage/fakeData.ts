/**
 * Sample test data for seeding the BackChannel database
 * This file provides demo data for development and testing purposes
 */

import { FeedbackPackage, ReviewComment, CommentState } from '../../types'

/**
 * Creates a sample feedback package with comments
 * @returns A sample feedback package with comments
 */
export const createSampleFeedbackPackage = (): FeedbackPackage => {
  const now = Date.now()

  return {
    id: 'demo-package-1',
    metadata: {
      documentTitle: 'Military Field Operations Manual',
      documentRootUrl: 'https://example.mil/field-ops-manual',
      documentVersion: '2.3.1',
    },
    comments: createSampleComments(),
    createdAt: now,
    updatedAt: now,
    version: '1.0.0',
  }
}

/**
 * Creates sample comments for the feedback package
 * @returns An array of sample comments
 */
export const createSampleComments = (): ReviewComment[] => {
  const now = Date.now()

  return [
    {
      id: 'comment-1',
      text: 'This section needs to be updated with the latest protocol changes from HQ.',
      pageUrl: 'https://example.mil/field-ops-manual/chapter1',
      timestamp: now - 3 * 24 * 60 * 60 * 1000, // 3 days ago
      location: '/html/body/div[2]/section[1]/p[3]',
      snippet: 'Field communication protocols require secure channels...',
      author: 'Smith, John',
      state: CommentState.Open,
    },
    {
      id: 'comment-2',
      text: 'The diagram here is outdated. We should replace it with the new formation layout.',
      pageUrl: 'https://example.mil/field-ops-manual/chapter2',
      timestamp: now - 2 * 24 * 60 * 60 * 1000, // 2 days ago
      location: '/html/body/div[2]/section[3]/figure[1]',
      snippet: 'Standard field formation for reconnaissance...',
      author: 'Johnson, Sarah',
      state: CommentState.Open,
    },
    {
      id: 'comment-3',
      text: 'This information conflicts with the updated safety guidelines issued last month.',
      pageUrl: 'https://example.mil/field-ops-manual/chapter3',
      timestamp: now - 1 * 24 * 60 * 60 * 1000, // 1 day ago
      location: '/html/body/div[2]/section[2]/ul/li[4]',
      snippet: 'Safety measures for hazardous environments...',
      author: 'Williams, Robert',
      state: CommentState.Open,
    },
    {
      id: 'comment-4',
      text: 'Excellent explanation of the new equipment. No changes needed here.',
      pageUrl: 'https://example.mil/field-ops-manual/chapter4',
      timestamp: now - 12 * 60 * 60 * 1000, // 12 hours ago
      location: '/html/body/div[2]/section[4]/p[2]',
      snippet: 'The new field communication device provides enhanced security...',
      author: 'Smith, John',
      state: CommentState.Resolved,
    },
    {
      id: 'comment-5',
      text: 'This section should reference the updated field manual appendix B.',
      pageUrl: 'https://example.mil/field-ops-manual/chapter5',
      timestamp: now - 6 * 60 * 60 * 1000, // 6 hours ago
      location: '/html/body/div[2]/section[1]/p[5]',
      snippet: 'For additional information on field procedures...',
      author: 'Johnson, Sarah',
      state: CommentState.Open,
    },
  ]
}

/**
 * Demo database seed for development and testing
 */
export const demoDatabaseSeed = {
  version: '1.0.0',
  databases: [
    {
      name: 'backchannel_demo',
      feedbackPackage: createSampleFeedbackPackage(),
    },
  ],
}

/**
 * Attaches the demo database seed to the window object
 * This should be called during development/testing to make the seed data available
 */
export const attachDemoDatabaseSeed = (): void => {
  ;(window as any).demoDatabaseSeed = demoDatabaseSeed
}
