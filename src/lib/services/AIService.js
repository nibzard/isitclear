// ABOUTME: AI Service for Chrome Gemini Nano API integration
// ABOUTME: Handles text analysis, session management, and fallback between Rewriter and Prompt APIs

import { ClarityImprovement, ChangeDetail } from '../models/ClarityImprovement.js'

export class AIService {
  constructor () {
    this.sessions = new Map()
    this.sessionCounter = 0
  }

  async analyzeText (request) {
    this.validateTextAnalysisRequest(request)

    const startTime = Date.now()
    let result = null

    try {
      if (request.apiType === 'rewriter') {
        result = await this._analyzeWithRewriter(request.text, request.parameters)
      } else {
        result = await this._analyzeWithPrompt(request.text, request.parameters)
      }

      if (!result && request.apiType === 'rewriter') {
        console.log('Rewriter failed, falling back to Prompt API')
        result = await this._analyzeWithPrompt(request.text, request.parameters)
      }

      if (!result) {
        throw new Error('Both AI APIs failed')
      }

      const processingTime = Date.now() - startTime

      return {
        success: true,
        improvedText: result.improvedText,
        confidenceScore: result.confidenceScore || 0.8,
        processingTime,
        apiUsed: result.apiUsed
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: this._getErrorCode(error),
          message: error.message
        }
      }
    }
  }

  async createAISession (request) {
    try {
      let session = null
      let capabilities = null

      if (request.apiType === 'rewriter') {
        capabilities = await chrome.ai.rewriter.capabilities()
        if (capabilities.available !== 'readily') {
          throw new Error('Rewriter API not available')
        }

        session = await chrome.ai.rewriter.create(request.defaultParameters)
      } else {
        capabilities = await chrome.ai.languageModel.capabilities()
        if (capabilities.available !== 'readily') {
          throw new Error('Prompt API not available')
        }

        session = await chrome.ai.languageModel.create(request.defaultParameters)
      }

      const sessionId = `session-${++this.sessionCounter}`
      this.sessions.set(sessionId, {
        session,
        apiType: request.apiType,
        created: Date.now()
      })

      return {
        success: true,
        sessionId,
        capabilities: {
          maxTextLength: capabilities.maxLength || 5000,
          supportedLanguages: ['en']
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: error.message.includes('not available') ? 'API_NOT_AVAILABLE' : 'INSUFFICIENT_RESOURCES',
          message: error.message
        }
      }
    }
  }

  async destroyAISession (sessionId) {
    const sessionData = this.sessions.get(sessionId)
    if (!sessionData) {
      return false
    }

    try {
      await sessionData.session.destroy()
      this.sessions.delete(sessionId)
      return true
    } catch (error) {
      console.error('Error destroying session:', error)
      return false
    }
  }

  async _analyzeWithRewriter (text, parameters = {}) {
    try {
      const capabilities = await chrome.ai.rewriter.capabilities()
      if (capabilities.available !== 'readily') {
        return null
      }

      const session = await chrome.ai.rewriter.create({
        tone: parameters.tone || 'as-is',
        length: parameters.length || 'as-is',
        format: parameters.format || 'plain-text'
      })

      const improvedText = await session.rewrite(text)
      await session.destroy()

      return {
        improvedText,
        apiUsed: 'rewriter',
        confidenceScore: 0.85
      }
    } catch (error) {
      console.error('Rewriter API error:', error)
      return null
    }
  }

  async _analyzeWithPrompt (text, parameters = {}) {
    try {
      const capabilities = await chrome.ai.languageModel.capabilities()
      if (capabilities.available !== 'readily') {
        return null
      }

      const session = await chrome.ai.languageModel.create()

      const prompt = `Please improve the clarity of this text while preserving its meaning. Make it more concise and easier to understand:\n\n"${text}"\n\nImproved version:`

      const improvedText = await session.prompt(prompt)
      await session.destroy()

      return {
        improvedText: improvedText.trim(),
        apiUsed: 'prompt',
        confidenceScore: 0.75
      }
    } catch (error) {
      console.error('Prompt API error:', error)
      return null
    }
  }

  validateTextAnalysisRequest (request) {
    if (!request.text || typeof request.text !== 'string') {
      throw new Error('Text is required')
    }

    if (request.text.length === 0) {
      throw new Error('Text must not be empty')
    }

    if (request.text.length > 5000) {
      throw new Error('Text exceeds maximum length')
    }

    if (!['rewriter', 'prompt'].includes(request.apiType)) {
      throw new Error('Invalid API type')
    }
  }

  _getErrorCode (error) {
    if (error.message.includes('not available')) {
      return 'API_UNAVAILABLE'
    }
    if (error.message.includes('session')) {
      return 'SESSION_FAILED'
    }
    if (error.message.includes('length')) {
      return 'TEXT_TOO_LONG'
    }
    return 'PROCESSING_ERROR'
  }

  // Cleanup old sessions (should be called periodically)
  cleanupOldSessions (maxAgeMs = 300000) { // 5 minutes
    const now = Date.now()
    for (const [sessionId, sessionData] of this.sessions.entries()) {
      if (now - sessionData.created > maxAgeMs) {
        this.destroyAISession(sessionId)
      }
    }
  }
}

// Export the main service instance
export const aiService = new AIService()

// Export the functions needed by contract tests
export function validateTextAnalysisRequest (request) {
  return aiService.validateTextAnalysisRequest(request)
}

export function createAISession (sessionRequest) {
  return aiService.createAISession(sessionRequest)
}

export function analyzeText (analysisRequest) {
  return aiService.analyzeText(analysisRequest)
}

export function destroyAISession (sessionId) {
  return aiService.destroyAISession(sessionId)
}
