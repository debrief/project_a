/**
 * Unit tests for BackChannel types
 */

import {
  BackChannelConfig,
  CaptureComment,
  ReviewComment,
  CommentState,
  DocumentMetadata,
  PluginMode,
} from '../src/types'

describe('BackChannel Types', () => {
  describe('Enums', () => {
    test('CommentState has the correct values', () => {
      expect(CommentState.Open).toBe('open')
      expect(CommentState.Accepted).toBe('accepted')
      expect(CommentState.Rejected).toBe('rejected')
      expect(CommentState.Resolved).toBe('resolved')
    })

    test('PluginMode has the correct values', () => {
      expect(PluginMode.Capture).toBe('capture')
      expect(PluginMode.Review).toBe('review')
    })
  })

  describe('Interfaces', () => {
    test('Can create a valid DocumentMetadata object', () => {
      const documentMetadata: DocumentMetadata = {
        documentTitle: 'Example Document',
        documentRootUrl: 'https://example.com/docs/',
      }

      expect(documentMetadata.documentTitle).toBe('Example Document')
      expect(documentMetadata.documentRootUrl).toBe('https://example.com/docs/')
    })

    test('Can create a valid CaptureComment object', () => {
      const comment: CaptureComment = {
        id: '123',
        text: 'This is a test comment',
        pageUrl: 'https://example.com/docs/page1.html',
        timestamp: Date.now(),
        location: '/html/body/div[1]/p[2]',
        snippet: 'This is the text being commented on',
        author: 'JD',
      }

      expect(comment.id).toBe('123')
      expect(comment.text).toBe('This is a test comment')
      expect(comment.pageUrl).toBe('https://example.com/docs/page1.html')
      expect(typeof comment.timestamp).toBe('number')
      expect(comment.location).toBe('/html/body/div[1]/p[2]')
      expect(comment.snippet).toBe('This is the text being commented on')
      expect(comment.author).toBe('JD')
    })

    test('Can create a valid ReviewComment object', () => {
      const captureComment: CaptureComment = {
        id: '123',
        text: 'This is a test comment',
        pageUrl: 'https://example.com/docs/page1.html',
        timestamp: Date.now(),
        location: '/html/body/div[1]/p[2]',
        author: 'JD',
      }

      const reviewComment: ReviewComment = {
        ...captureComment,
        state: CommentState.Accepted,
        editorNotes: 'This has been addressed',
        reviewedBy: 'Editor',
        reviewedAt: Date.now(),
      }

      expect(reviewComment.id).toBe('123')
      expect(reviewComment.text).toBe('This is a test comment')
      expect(reviewComment.state).toBe(CommentState.Accepted)
      expect(reviewComment.editorNotes).toBe('This has been addressed')
      expect(reviewComment.reviewedBy).toBe('Editor')
      expect(typeof reviewComment.reviewedAt).toBe('number')
    })

    test('Can create a valid BackChannelConfig object', () => {
      const config: BackChannelConfig = {
        targetSelector: '.custom-reviewable',
        requireInitials: false,
        allowExport: true,
        storageKey: 'custom-backchannel',
        initialMode: PluginMode.Review,
        showIconOnLoad: false,
        iconPosition: 'bottom-left',
      }

      expect(config.targetSelector).toBe('.custom-reviewable')
      expect(config.requireInitials).toBe(false)
      expect(config.allowExport).toBe(true)
      expect(config.storageKey).toBe('custom-backchannel')
      expect(config.initialMode).toBe(PluginMode.Review)
      expect(config.showIconOnLoad).toBe(false)
      expect(config.iconPosition).toBe('bottom-left')
    })
  })
})
