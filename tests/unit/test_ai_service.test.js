// ABOUTME: Unit tests for AIService error handling and edge cases
// ABOUTME: Tests individual service functions in isolation

const { describe, it, expect, beforeEach } = require('@jest/globals')
const { AIService } = require('../../src/lib/services/ai-service.js')

describe('AIService Unit Tests', () => {
  let aiService

  beforeEach(() => {
    aiService = new AIService()
    global.Rewriter = {
      create: jest.fn()
    }
    global.Prompt = {
      create: jest.fn()
    }
  })

  describe('Session Management', () => {
    it('should create rewriter session successfully', async () => {
      const mockSession = {
        rewrite: jest.fn()
      }
      Rewriter.create.mockResolvedValue(mockSession)

      const request = {
        apiType: 'rewriter',
        defaultParameters: { tone: 'professional' }
      }

      const result = await aiService.createSession(request)

      expect(result.success).toBe(true)
      expect(result.sessionId).toBeDefined()
      expect(result.capabilities.maxTextLength).toBe(5000)
    })

    it('should handle rewriter API unavailability', async () => {
      global.Rewriter = undefined

      const request = {
        apiType: 'rewriter',
        defaultParameters: {}
      }

      const result = await aiService.createSession(request)

      expect(result.success).toBe(false)
      expect(result.error).toBe('API_NOT_AVAILABLE')
    })

    it('should validate session request parameters', async () => {
      const invalidRequest = {
        apiType: 'invalid_api'
      }

      await expect(aiService.createSession(invalidRequest))
        .rejects.toThrow('Invalid API type')
    })
  })

  describe('Text Analysis Error Handling', () => {
    it('should handle empty text input', async () => {
      const request = {
        sessionId: 'test-session',
        text: ''
      }

      await expect(aiService.analyzeText(request))
        .rejects.toThrow('Text is required')
    })

    it('should handle text exceeding maximum length', async () => {
      const longText = 'a'.repeat(5001)
      const request = {
        sessionId: 'test-session',
        text: longText
      }

      await expect(aiService.analyzeText(request))
        .rejects.toThrow('exceeds maximum length')
    })

    it('should handle invalid session ID', async () => {
      const request = {
        sessionId: 'non-existent-session',
        text: 'Test text'
      }

      await expect(aiService.analyzeText(request))
        .rejects.toThrow('Session not found')
    })
  })

  describe('Fallback Logic', () => {
    it('should fallback from rewriter to prompt on failure', async () => {
      const mockPromptSession = {
        prompt: jest.fn().mockResolvedValue('improved text')
      }
      Prompt.create.mockResolvedValue(mockPromptSession)
      Rewriter.create.mockRejectedValue(new Error('Rewriter failed'))

      const aiService = new AIService()
      aiService.fallbackEnabled = true

      const request = {
        apiType: 'rewriter',
        defaultParameters: {}
      }

      const sessionResult = await aiService.createSession(request)
      expect(sessionResult.success).toBe(true)
      expect(sessionResult.apiType).toBe('prompt')
    })

    it('should handle fallback failure gracefully', async () => {
      Rewriter.create.mockRejectedValue(new Error('Rewriter failed'))
      Prompt.create.mockRejectedValue(new Error('Prompt failed'))

      const aiService = new AIService()
      aiService.fallbackEnabled = true

      const request = {
        apiType: 'rewriter',
        defaultParameters: {}
      }

      const result = await aiService.createSession(request)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Session Timeout', () => {
    it('should cleanup expired sessions', async () => {
      const oldSessionId = 'old-session'
      const oldTimestamp = Date.now() - 400000 // More than 5 minutes ago

      aiService.sessions.set(oldSessionId, {
        timestamp: oldTimestamp,
        session: { close: jest.fn() }
      })

      await aiService._cleanupExpiredSessions()

      expect(aiService.sessions.has(oldSessionId)).toBe(false)
    })

    it('should keep active sessions', async () => {
      const activeSessionId = 'active-session'
      const recentTimestamp = Date.now() - 60000 // 1 minute ago

      aiService.sessions.set(activeSessionId, {
        timestamp: recentTimestamp,
        session: { close: jest.fn() }
      })

      await aiService._cleanupExpiredSessions()

      expect(aiService.sessions.has(activeSessionId)).toBe(true)
    })
  })
})