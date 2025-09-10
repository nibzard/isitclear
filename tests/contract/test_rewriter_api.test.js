// ABOUTME: Contract tests for Chrome Rewriter API integration
// ABOUTME: Validates API schemas and responses match expected contracts

const { TextAnalysisRequest, TextAnalysisResponse, SessionCreateRequest, SessionCreateResponse } = require('../schemas/api-schemas')

describe('Chrome Rewriter API Contract Tests', () => {
  describe('Session Creation', () => {
    test('should create Rewriter session with valid parameters', async () => {
      // Contract: SessionCreateRequest schema
      const request = {
        apiType: 'rewriter',
        defaultParameters: {
          tone: 'as-is',
          length: 'as-is'
        }
      }

      // This will fail initially - no implementation exists yet
      const RewriterService = require('../../src/lib/services/ai-service')
      const response = await RewriterService.createSession(request)

      // Contract: SessionCreateResponse schema
      expect(response).toMatchObject({
        success: expect.any(Boolean),
        sessionId: expect.any(String),
        capabilities: expect.objectContaining({
          maxTextLength: expect.any(Number),
          supportedLanguages: expect.any(Array)
        })
      })

      if (response.success) {
        expect(response.sessionId).toBeTruthy()
        expect(response.capabilities.maxTextLength).toBeGreaterThan(0)
        expect(response.capabilities.supportedLanguages).toContain('en')
      }
    })

    test('should reject invalid API type in session creation', async () => {
      const request = {
        apiType: 'invalid-api-type',
        defaultParameters: {}
      }

      const RewriterService = require('../../src/lib/services/ai-service')

      await expect(RewriterService.createSession(request)).rejects.toThrow('Invalid API type')
    })

    test('should handle missing required parameters', async () => {
      const request = {} // Missing apiType

      const RewriterService = require('../../src/lib/services/ai-service')

      await expect(RewriterService.createSession(request)).rejects.toThrow('Missing required parameter: apiType')
    })

    test('should handle Rewriter API unavailable', async () => {
      // Mock Rewriter API as unavailable
      global.Rewriter = undefined

      const request = {
        apiType: 'rewriter',
        defaultParameters: {}
      }

      const RewriterService = require('../../src/lib/services/ai-service')
      const response = await RewriterService.createSession(request)

      expect(response).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'API_NOT_AVAILABLE',
          message: expect.any(String)
        })
      })
    })

    test('should validate tone parameter values', async () => {
      const request = {
        apiType: 'rewriter',
        defaultParameters: {
          tone: 'invalid-tone'
        }
      }

      const RewriterService = require('../../src/lib/services/ai-service')

      await expect(RewriterService.createSession(request)).rejects.toThrow('Invalid tone parameter')
    })

    test('should validate length parameter values', async () => {
      const request = {
        apiType: 'rewriter',
        defaultParameters: {
          length: 'invalid-length'
        }
      }

      const RewriterService = require('../../src/lib/services/ai-service')

      await expect(RewriterService.createSession(request)).rejects.toThrow('Invalid length parameter')
    })
  })

  describe('Session Destruction', () => {
    test('should destroy existing session successfully', async () => {
      const RewriterService = require('../../src/lib/services/ai-service')

      // Create session first
      const createRequest = {
        apiType: 'rewriter',
        defaultParameters: {}
      }
      const createResponse = await RewriterService.createSession(createRequest)

      if (createResponse.success) {
        const result = await RewriterService.destroySession(createResponse.sessionId)
        expect(result).toBe(true)
      }
    })

    test('should handle destroying non-existent session', async () => {
      const RewriterService = require('../../src/lib/services/ai-service')

      const result = await RewriterService.destroySession('non-existent-session-id')
      expect(result).toBe(false)
    })
  })

  describe('Text Analysis', () => {
    test('should analyze text with valid parameters', async () => {
      // Reset mocks to working state (in case previous tests modified them)
      global.Rewriter = {
        create: jest.fn(() => createMockAISession('rewriter'))
      }
      global.Prompt = {
        create: jest.fn(() => createMockAISession('prompt'))
      }

      // Contract: TextAnalysisRequest schema
      const request = {
        text: 'This is some text that could be improved for clarity.',
        apiType: 'rewriter',
        parameters: {
          tone: 'as-is',
          length: 'as-is',
          format: 'plain-text'
        }
      }

      // Clear module cache so updated mocks take effect
      delete require.cache[require.resolve('../../src/lib/services/ai-service')]
      const RewriterService = require('../../src/lib/services/ai-service')
      const response = await RewriterService.analyzeText(request)

      // Contract: TextAnalysisResponse schema
      expect(response).toMatchObject({
        success: expect.any(Boolean),
        improvedText: expect.any(String)
      })

      if (response.success) {
        expect(response.improvedText).toBeTruthy()
        expect(response.improvedText).not.toBe(request.text) // Should be improved
        expect(response.confidenceScore).toBeGreaterThanOrEqual(0)
        expect(response.confidenceScore).toBeLessThanOrEqual(1)
        expect(response.processingTime).toBeGreaterThanOrEqual(0)
        expect(response.apiUsed).toBe('rewriter')
      }
    })

    test('should reject empty text', async () => {
      const request = {
        text: '',
        apiType: 'rewriter',
        parameters: {}
      }

      const RewriterService = require('../../src/lib/services/ai-service')

      await expect(RewriterService.analyzeText(request)).rejects.toThrow('Text cannot be empty')
    })

    test('should reject text exceeding maximum length', async () => {
      const longText = 'a'.repeat(5001) // Exceeds 5000 character limit
      const request = {
        text: longText,
        apiType: 'rewriter',
        parameters: {}
      }

      const RewriterService = require('../../src/lib/services/ai-service')

      await expect(RewriterService.analyzeText(request)).rejects.toThrow('TEXT_TOO_LONG')
    })

    test('should handle processing errors gracefully', async () => {
      // Mock both APIs to throw errors so fallback also fails
      const mockRewriter = {
        rewrite: jest.fn().mockRejectedValue(new Error('AI processing failed'))
      }
      const mockPrompt = {
        prompt: jest.fn().mockRejectedValue(new Error('Prompt processing failed'))
      }

      global.Rewriter = {
        create: jest.fn().mockResolvedValue(mockRewriter)
      }
      global.Prompt = {
        create: jest.fn().mockResolvedValue(mockPrompt)
      }

      const request = {
        text: 'Test text',
        apiType: 'rewriter',
        parameters: {}
      }

      // Clear module cache so updated mocks take effect
      delete require.cache[require.resolve('../../src/lib/services/ai-service')]
      const RewriterService = require('../../src/lib/services/ai-service')
      const response = await RewriterService.analyzeText(request)

      expect(response).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'API_UNAVAILABLE',
          message: expect.any(String)
        })
      })
    })

    test('should respect tone parameter', async () => {
      const request = {
        text: 'Hey, what do you think about this?',
        apiType: 'rewriter',
        parameters: {
          tone: 'more-formal'
        }
      }

      const RewriterService = require('../../src/lib/services/ai-service')
      const response = await RewriterService.analyzeText(request)

      if (response.success) {
        // Formal tone should be more professional
        expect(response.improvedText).not.toContain('Hey')
        expect(response.improvedText.length).toBeGreaterThan(0)
      }
    })

    test('should respect length parameter', async () => {
      const request = {
        text: 'This is a long sentence that could potentially be made shorter.',
        apiType: 'rewriter',
        parameters: {
          length: 'shorter'
        }
      }

      const RewriterService = require('../../src/lib/services/ai-service')
      const response = await RewriterService.analyzeText(request)

      if (response.success) {
        // Shortened text should be shorter than original
        expect(response.improvedText.length).toBeLessThan(request.text.length)
      }
    })

    test('should handle session failure during analysis', async () => {
      // Mock both session creation to fail so fallback also fails
      global.Rewriter = {
        create: jest.fn().mockRejectedValue(new Error('Session creation failed'))
      }
      global.Prompt = {
        create: jest.fn().mockRejectedValue(new Error('Prompt session creation failed'))
      }

      const request = {
        text: 'Test text',
        apiType: 'rewriter',
        parameters: {}
      }

      // Clear module cache so updated mocks take effect
      delete require.cache[require.resolve('../../src/lib/services/ai-service')]
      const RewriterService = require('../../src/lib/services/ai-service')
      const response = await RewriterService.analyzeText(request)

      expect(response).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'API_UNAVAILABLE',
          message: expect.any(String)
        })
      })
    })
  })
})
