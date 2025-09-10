// ABOUTME: Contract tests for Chrome AI APIs (Rewriter and Prompt)
// ABOUTME: Validates API schemas match the contracts defined in specs/001-we-should-create/contracts/

const { describe, it, expect, beforeEach, jest } = require('@jest/globals')

describe('Chrome AI API Contract Tests', () => {
  let mockRewriterSession
  let mockPromptSession

  beforeEach(() => {
    mockRewriterSession = {
      rewrite: jest.fn(),
      destroy: jest.fn()
    }

    mockPromptSession = {
      prompt: jest.fn(),
      destroy: jest.fn()
    }

    // Reset Chrome AI API mocks
    chrome.ai.rewriter.create.mockResolvedValue(mockRewriterSession)
    chrome.ai.languageModel.create.mockResolvedValue(mockPromptSession)
  })

  describe('TextAnalysisRequest Schema Validation', () => {
    it('should validate required fields for text analysis request', async () => {
      const validRequest = {
        text: 'Sample text to analyze',
        apiType: 'rewriter',
        parameters: {
          tone: 'as-is',
          length: 'as-is',
          format: 'plain-text'
        }
      }

      // This test will fail until we implement the AI service
      expect(() => validateTextAnalysisRequest(validRequest)).not.toThrow()
    })

    it('should reject request with missing text', async () => {
      const invalidRequest = {
        apiType: 'rewriter'
      }

      // This test will fail until we implement validation
      expect(() => validateTextAnalysisRequest(invalidRequest)).toThrow('Text is required')
    })

    it('should reject request with text exceeding 5000 characters', async () => {
      const invalidRequest = {
        text: 'a'.repeat(5001),
        apiType: 'rewriter'
      }

      // This test will fail until we implement validation
      expect(() => validateTextAnalysisRequest(invalidRequest)).toThrow('Text exceeds maximum length')
    })

    it('should reject request with invalid apiType', async () => {
      const invalidRequest = {
        text: 'Sample text',
        apiType: 'invalid-api'
      }

      // This test will fail until we implement validation
      expect(() => validateTextAnalysisRequest(invalidRequest)).toThrow('Invalid API type')
    })
  })

  describe('Rewriter API Session Creation', () => {
    it('should create rewriter session with valid parameters', async () => {
      const sessionRequest = {
        apiType: 'rewriter',
        defaultParameters: {
          tone: 'more-formal',
          length: 'as-is'
        }
      }

      // This test will fail until we implement the AI service
      const result = await createAISession(sessionRequest)

      expect(result.success).toBe(true)
      expect(result.sessionId).toBeDefined()
      expect(result.capabilities).toBeDefined()
      expect(result.capabilities.maxTextLength).toBe(5000)
    })

    it('should handle rewriter API unavailable', async () => {
      chrome.ai.rewriter.capabilities.mockResolvedValue({ available: 'no' })

      const sessionRequest = {
        apiType: 'rewriter'
      }

      // This test will fail until we implement error handling
      const result = await createAISession(sessionRequest)

      expect(result.success).toBe(false)
      expect(result.error.code).toBe('API_NOT_AVAILABLE')
      expect(result.error.message).toContain('Rewriter API not available')
    })
  })

  describe('Prompt API Session Creation', () => {
    it('should create prompt session as fallback', async () => {
      const sessionRequest = {
        apiType: 'prompt',
        defaultParameters: {
          tone: 'neutral'
        }
      }

      // This test will fail until we implement the AI service
      const result = await createAISession(sessionRequest)

      expect(result.success).toBe(true)
      expect(result.sessionId).toBeDefined()
      expect(result.capabilities).toBeDefined()
    })
  })

  describe('Text Analysis Response Schema', () => {
    it('should return valid analysis response from rewriter API', async () => {
      const analysisRequest = {
        text: 'This is a test sentence that could be improved.',
        apiType: 'rewriter',
        parameters: {
          tone: 'as-is',
          length: 'shorter'
        }
      }

      mockRewriterSession.rewrite.mockResolvedValue('This test sentence could improve.')

      // This test will fail until we implement the AI service
      const result = await analyzeText(analysisRequest)

      expect(result.success).toBe(true)
      expect(result.improvedText).toBeDefined()
      expect(result.confidenceScore).toBeGreaterThan(0)
      expect(result.confidenceScore).toBeLessThanOrEqual(1)
      expect(result.processingTime).toBeGreaterThan(0)
      expect(result.apiUsed).toBe('rewriter')
    })

    it('should handle rewriter API processing errors', async () => {
      const analysisRequest = {
        text: 'Sample text',
        apiType: 'rewriter'
      }

      mockRewriterSession.rewrite.mockRejectedValue(new Error('Processing failed'))

      // This test will fail until we implement error handling
      const result = await analyzeText(analysisRequest)

      expect(result.success).toBe(false)
      expect(result.error.code).toBe('PROCESSING_ERROR')
      expect(result.error.message).toContain('Processing failed')
    })

    it('should fallback to prompt API when rewriter fails', async () => {
      const analysisRequest = {
        text: 'Sample text that needs improvement',
        apiType: 'rewriter'
      }

      // Simulate rewriter failure
      mockRewriterSession.rewrite.mockRejectedValue(new Error('Rewriter failed'))
      mockPromptSession.prompt.mockResolvedValue('Improved sample text.')

      // This test will fail until we implement fallback logic
      const result = await analyzeText(analysisRequest)

      expect(result.success).toBe(true)
      expect(result.apiUsed).toBe('prompt')
      expect(result.improvedText).toBe('Improved sample text.')
    })
  })

  describe('Session Management', () => {
    it('should destroy session when requested', async () => {
      const sessionId = 'test-session-123'

      // This test will fail until we implement session management
      const result = await destroyAISession(sessionId)

      expect(mockRewriterSession.destroy).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should handle session not found error', async () => {
      const sessionId = 'non-existent-session'

      // This test will fail until we implement session management
      const result = await destroyAISession(sessionId)

      expect(result).toBe(false)
    })
  })
})
