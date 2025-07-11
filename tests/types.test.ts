/**
 * Unit tests for BackChannel types
 */

import {
  BackChannelConfig,
  Comment,
  FeedbackPackage,
  FeedbackState,
  PageMetadata,
  PluginMode,
} from '../src/types'

describe('BackChannel Types', () => {
  describe('Enums', () => {
    test('FeedbackState has the correct values', () => {
      expect(FeedbackState.New).toBe('new')
      expect(FeedbackState.Acknowledged).toBe('acknowledged')
      expect(FeedbackState.Resolved).toBe('resolved')
    })

    test('PluginMode has the correct values', () => {
      expect(PluginMode.Capture).toBe('capture')
      expect(PluginMode.Review).toBe('review')
    })
  })

  describe('Interfaces', () => {
    test('Can create a valid PageMetadata object', () => {
      const pageMetadata: PageMetadata = {
        url: 'https://example.com',
        title: 'Example Page',
        timestamp: Date.now(),
        additionalInfo: {
          author: 'Test Author',
          version: '1.0.0',
        },
      }

      expect(pageMetadata.url).toBe('https://example.com')
      expect(pageMetadata.title).toBe('Example Page')
      expect(typeof pageMetadata.timestamp).toBe('number')
      expect(pageMetadata.additionalInfo?.author).toBe('Test Author')
    })

    test('Can create a valid Comment object', () => {
      const pageMetadata: PageMetadata = {
        url: 'https://example.com',
        title: 'Example Page',
        timestamp: Date.now(),
      }

      const comment: Comment = {
        id: '123',
        text: 'This is a test comment',
        author: 'JD',
        timestamp: Date.now(),
        elementSelector: '#test-element',
        state: FeedbackState.New,
        pageMetadata,
      }

      expect(comment.id).toBe('123')
      expect(comment.text).toBe('This is a test comment')
      expect(comment.author).toBe('JD')
      expect(comment.state).toBe(FeedbackState.New)
      expect(comment.pageMetadata).toBe(pageMetadata)
    })

    test('Can create a valid FeedbackPackage object', () => {
      const pageMetadata: PageMetadata = {
        url: 'https://example.com',
        title: 'Example Page',
        timestamp: Date.now(),
      }

      const comment: Comment = {
        id: '123',
        text: 'This is a test comment',
        author: 'JD',
        timestamp: Date.now(),
        elementSelector: '#test-element',
        state: FeedbackState.New,
        pageMetadata,
      }

      const feedbackPackage: FeedbackPackage = {
        id: 'package-123',
        title: 'Test Feedback Package',
        author: 'John Doe',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        comments: [comment],
        metadata: {
          version: '1.0.0',
        },
      }

      expect(feedbackPackage.id).toBe('package-123')
      expect(feedbackPackage.title).toBe('Test Feedback Package')
      expect(feedbackPackage.author).toBe('John Doe')
      expect(feedbackPackage.comments.length).toBe(1)
      expect(feedbackPackage.comments[0]).toBe(comment)
      expect(feedbackPackage.metadata?.version).toBe('1.0.0')
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
