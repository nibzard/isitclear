// ABOUTME: Contract tests for Chrome Prompt API integration
// ABOUTME: Validates API schemas and responses for fallback AI functionality

describe('Chrome Prompt API Contract Tests', () => {
  describe('Session Creation', () => {
    test('should create Prompt session with valid parameters', async () => {
      // Contract: SessionCreateRequest schema
      const request = {
        apiType: 'prompt',
        defaultParameters: {
          tone: 'as-is',
          length: 'as-is'
        }
      }

      // This will fail initially - no implementation exists yet
      const PromptService = require('../../src/lib/services/ai-service')
      const response = await PromptService.createSession(request)

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

    test('should handle Prompt API unavailable', async () => {
      // Mock Prompt API as unavailable
      global.Prompt = undefined

      const request = {
        apiType: 'prompt',
        defaultParameters: {}
      }

      const PromptService = require('../../src/lib/services/ai-service')
      const response = await PromptService.createSession(request)

      expect(response).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'API_NOT_AVAILABLE',
          message: expect.any(String)
        })
      })
    })

    test('should destroy Prompt session successfully', async () => {
      const PromptService = require('../../src/lib/services/ai-service')

      // Create session first
      const createRequest = {
        apiType: 'prompt',
        defaultParameters: {}
      }
      const createResponse = await PromptService.createSession(createRequest)

      if (createResponse.success) {
        const result = await PromptService.destroySession(createResponse.sessionId)
        expect(result).toBe(true)
      }
    })
  })

  describe('Text Analysis via Prompt', () => {
    test('should analyze text using custom prompts', async () => {
      // Contract: TextAnalysisRequest schema for Prompt API
      const request = {
        text: 'This is some unclear text that needs improvement.',
        apiType: 'prompt',
        parameters: {
          tone: 'as-is',
          format: 'plain-text'
        }
      }

      // This will fail initially - no implementation exists yet
      const PromptService = require('../../src/lib/services/ai-service')
      const response = await PromptService.analyzeText(request)

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
        expect(response.processingTime).toBeGreaterThan(0)
        expect(response.apiUsed).toBe('prompt')
      }
    })

    test('should use clarity-focused prompts', async () => {
      const request = {
        text: 'I think maybe we should probably consider doing this thing.',
        apiType: 'prompt',
        parameters: {}
      }

      const PromptService = require('../../src/lib/services/ai-service')
      const response = await PromptService.analyzeText(request)

      if (response.success) {
        // Should improve clarity by removing filler words
        expect(response.improvedText).not.toContain('I think maybe')
        expect(response.improvedText).not.toContain('probably')
        expect(response.improvedText.length).toBeGreaterThan(0)
      }
    })

    test('should handle complex clarity analysis', async () => {
      const complexText = 'The thing is, when you think about it, there are various factors that might potentially influence the outcome of this situation, depending on how things go.'

      const request = {
        text: complexText,
        apiType: 'prompt',
        parameters: {}
      }

      const PromptService = require('../../src/lib/services/ai-service')
      const response = await PromptService.analyzeText(request)

      if (response.success) {
        // Should significantly improve clarity
        expect(response.improvedText.length).toBeLessThan(complexText.length)
        expect(response.improvedText).not.toContain('The thing is')
        expect(response.improvedText).not.toContain('various factors')
      }
    })

    test('should handle Prompt API processing errors', async () => {
      // Mock Prompt to throw error
      const mockPrompt = {
        prompt: jest.fn().mockRejectedValue(new Error('Prompt processing failed'))
      }
      global.Prompt = {
        create: jest.fn().mockResolvedValue(mockPrompt)
      }

      const request = {
        text: 'Test text',
        apiType: 'prompt',
        parameters: {}
      }

      const PromptService = require('../../src/lib/services/ai-service')
      const response = await PromptService.analyzeText(request)

      expect(response).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'PROCESSING_ERROR',
          message: expect.any(String)
        })
      })
    })

    test('should fallback from Rewriter to Prompt API', async () => {
      // Mock Rewriter as unavailable
      global.Rewriter = undefined

      // Mock Prompt as available
      const mockPrompt = {
        prompt: jest.fn().mockResolvedValue('Clear and improved text.')
      }
      global.Prompt = {
        create: jest.fn().mockResolvedValue(mockPrompt)
      }

      const request = {
        text: 'Unclear text that needs improvement.',
        apiType: 'rewriter', // Originally requested Rewriter
        parameters: {}
      }

      const AIService = require('../../src/lib/services/ai-service')
      const response = await AIService.analyzeText(request)

      if (response.success) {
        expect(response.apiUsed).toBe('prompt') // Fell back to Prompt API
        expect(response.improvedText).toBeTruthy()
      }
    })

    test('should handle both APIs unavailable', async () => {
      // Mock both APIs as unavailable
      global.Rewriter = undefined
      global.Prompt = undefined

      const request = {
        text: 'Test text',
        apiType: 'rewriter',
        parameters: {}
      }

      const AIService = require('../../src/lib/services/ai-service')
      const response = await AIService.analyzeText(request)

      expect(response).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'API_UNAVAILABLE',
          message: expect.stringContaining('No AI APIs available')
        })
      })
    })

    test('should validate custom prompt structure', async () => {
      const request = {
        text: 'Test text for clarity analysis',
        apiType: 'prompt',
        parameters: {}
      }

      // Mock to capture the prompt being used
      const mockPrompt = {
        prompt: jest.fn().mockResolvedValue('Improved text')
      }
      global.Prompt = {
        create: jest.fn().mockResolvedValue(mockPrompt)
      }

      const PromptService = require('../../src/lib/services/ai-service')
      await PromptService.analyzeText(request)

      // Verify the prompt includes clarity instructions
      expect(mockPrompt.prompt).toHaveBeenCalledWith(
        expect.stringContaining('improve the clarity')
      )
      expect(mockPrompt.prompt).toHaveBeenCalledWith(
        expect.stringContaining('Test text for clarity analysis')
      )
    })
  })
})
