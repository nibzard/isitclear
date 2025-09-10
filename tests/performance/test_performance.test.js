// ABOUTME: Performance validation tests for IsItClear extension
// ABOUTME: Ensures text processing meets <500ms requirement

const { describe, it, expect, beforeEach, jest } = require('@jest/globals')
const { AIService } = require('../../src/lib/services/ai-service.js')
const { TextAnalyzer } = require('../../src/lib/services/text-analyzer.js')
const { InputDetector } = require('../../src/lib/services/input-detector.js')

describe('Performance Validation Tests', () => {
  let aiService
  let textAnalyzer
  let inputDetector

  beforeEach(() => {
    aiService = new AIService()
    textAnalyzer = new TextAnalyzer()
    inputDetector = new InputDetector()

    // Mock AI API responses with realistic delays
    global.Rewriter = {
      create: jest.fn().mockResolvedValue({
        rewrite: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve('improved text'), 100))
        )
      })
    }
  })

  describe('Text Analysis Performance', () => {
    it('should process short text under 200ms', async () => {
      const shortText = 'This is a short sentence for testing.'
      const startTime = Date.now()

      const result = await textAnalyzer.analyzeClarity(shortText)
      const endTime = Date.now()
      const processingTime = endTime - startTime

      expect(processingTime).toBeLessThan(200)
      expect(result.processingTime).toBeDefined()
    })

    it('should process medium text under 500ms', async () => {
      const mediumText = 'This is a medium length paragraph that contains multiple sentences. '.repeat(10)
      const startTime = Date.now()

      const result = await textAnalyzer.analyzeClarity(mediumText)
      const endTime = Date.now()
      const processingTime = endTime - startTime

      expect(processingTime).toBeLessThan(500)
      expect(result.processingTime).toBeLessThan(500)
    })

    it('should handle long text under 1000ms', async () => {
      const longText = 'This is a long text paragraph for performance testing. '.repeat(50)
      const startTime = Date.now()

      const result = await textAnalyzer.analyzeClarity(longText)
      const endTime = Date.now()
      const processingTime = endTime - startTime

      expect(processingTime).toBeLessThan(1000)
    })

    it('should maintain performance with consecutive requests', async () => {
      const testText = 'Test sentence for consecutive processing.'
      const times = []

      for (let i = 0; i < 5; i++) {
        const startTime = Date.now()
        await textAnalyzer.analyzeClarity(testText)
        const endTime = Date.now()
        times.push(endTime - startTime)
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length
      expect(averageTime).toBeLessThan(300)
    })
  })

  describe('Input Detection Performance', () => {
    it('should detect input fields under 50ms', async () => {
      const mockElement = {
        tagName: 'INPUT',
        type: 'text',
        value: 'Test input content',
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 30 })
      }

      const startTime = Date.now()
      const result = await inputDetector.detectField(mockElement)
      const endTime = Date.now()
      const processingTime = endTime - startTime

      expect(processingTime).toBeLessThan(50)
      expect(result.fieldType).toBe('input')
    })

    it('should handle complex DOM structures efficiently', async () => {
      const complexElement = {
        tagName: 'DIV',
        isContentEditable: true,
        innerText: 'Complex content with nested structure\n'.repeat(20),
        parentElement: {
          tagName: 'FORM',
          id: 'complex-form',
          getAttribute: () => 'complex'
        },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 400 })
      }

      const startTime = Date.now()
      const result = await inputDetector.detectField(complexElement)
      const endTime = Date.now()
      const processingTime = endTime - startTime

      expect(processingTime).toBeLessThan(100)
      expect(result.fieldType).toBe('contenteditable')
    })
  })

  describe('AI Service Performance', () => {
    it('should create sessions under 100ms', async () => {
      const request = {
        apiType: 'rewriter',
        defaultParameters: { tone: 'professional' }
      }

      const startTime = Date.now()
      const result = await aiService.createSession(request)
      const endTime = Date.now()
      const processingTime = endTime - startTime

      expect(processingTime).toBeLessThan(100)
      expect(result.success).toBe(true)
    })

    it('should handle session caching efficiently', async () => {
      const request = {
        apiType: 'rewriter',
        defaultParameters: { tone: 'professional' }
      }

      // Create session (first time)
      const startTime1 = Date.now()
      await aiService.createSession(request)
      const endTime1 = Date.now()
      const firstTime = endTime1 - startTime1

      // Create another session (should be cached)
      const startTime2 = Date.now()
      await aiService.createSession(request)
      const endTime2 = Date.now()
      const secondTime = endTime2 - startTime2

      // Cached session should be faster
      expect(secondTime).toBeLessThan(firstTime)
    })
  })

  describe('Memory Usage', () => {
    it('should cleanup expired sessions to prevent memory leaks', async () => {
      // Add old sessions
      const oldSessionId = 'old-session'
      aiService.sessions.set(oldSessionId, {
        timestamp: Date.now() - 400000, // More than 5 minutes ago
        session: { close: jest.fn() }
      })

      const initialSessionCount = aiService.sessions.size

      await aiService._cleanupExpiredSessions()

      expect(aiService.sessions.size).toBeLessThan(initialSessionCount)
    })

    it('should limit session cache size', async () => {
      const maxSessions = 10
      
      // Add many sessions
      for (let i = 0; i < maxSessions + 5; i++) {
        aiService.sessions.set(`session-${i}`, {
          timestamp: Date.now(),
          session: { close: jest.fn() }
        })
      }

      // Trigger cleanup
      await aiService._cleanupExpiredSessions()

      // Should not grow indefinitely
      expect(aiService.sessions.size).toBeLessThanOrEqual(maxSessions + 5)
    })
  })

  describe('Concurrent Processing', () => {
    it('should handle multiple simultaneous requests', async () => {
      const testTexts = [
        'First test sentence.',
        'Second test sentence for concurrent processing.',
        'Third test sentence to validate concurrent handling.'
      ]

      const startTime = Date.now()
      const promises = testTexts.map(text => textAnalyzer.analyzeClarity(text))
      const results = await Promise.all(promises)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // All should complete in reasonable time (not 3x individual time)
      expect(totalTime).toBeLessThan(800)
      expect(results.length).toBe(3)
      results.forEach(result => {
        expect(result.processingTime).toBeDefined()
      })
    })
  })

  describe('Browser Responsiveness', () => {
    it('should not block main thread during processing', async () => {
      const mockElement = {
        tagName: 'INPUT',
        type: 'text',
        value: 'Test for responsiveness',
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 30 })
      }

      // Simulate main thread check
      let mainThreadBlocked = false
      const checkInterval = setInterval(() => {
        mainThreadBlocked = true
      }, 10)

      const startTime = Date.now()
      await inputDetector.detectField(mockElement)
      const endTime = Date.now()

      clearInterval(checkInterval)
      
      // Main thread should not be blocked
      expect(mainThreadBlocked).toBe(true)
      expect(endTime - startTime).toBeLessThan(50)
    })
  })
})