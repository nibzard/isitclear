// ABOUTME: Chrome AI API service for integrating with Rewriter and Prompt APIs
// ABOUTME: Handles session management, fallback logic, and error handling for AI operations

class AIService {
  constructor () {
    this.sessions = new Map()
    this.fallbackEnabled = true
    this.maxRetries = 3
    this.sessionTimeout = 300000 // 5 minutes
  }

  // Session creation and management
  async createSession (request) {
    try {
      this._validateSessionRequest(request)

      const { apiType, defaultParameters = {} } = request
      const sessionId = this._generateSessionId()

      let session = null
      let capabilities = null

      if (apiType === 'rewriter') {
        if (typeof Rewriter === 'undefined') {
          return this._createErrorResponse('API_NOT_AVAILABLE', 'Rewriter API is not available')
        }

        session = await Rewriter.create(defaultParameters)
        capabilities = {
          maxTextLength: 5000,
          supportedLanguages: ['en']
        }
      } else if (apiType === 'prompt') {
        if (typeof Prompt === 'undefined') {
          return this._createErrorResponse('API_NOT_AVAILABLE', 'Prompt API is not available')
        }

        session = await Prompt.create(defaultParameters)
        capabilities = {
          maxTextLength: 5000,
          supportedLanguages: ['en']
        }
      } else {
        throw new Error('Invalid API type')
      }

      // Store session with metadata
      this.sessions.set(sessionId, {
        session,
        apiType,
        parameters: defaultParameters,
        createdAt: Date.now(),
        lastUsed: Date.now()
      })

      // Set cleanup timer
      this._scheduleSessionCleanup(sessionId)

      return {
        success: true,
        sessionId,
        capabilities
      }
    } catch (error) {
      // Validation errors should be re-thrown
      if (error.message.includes('Missing required parameter') ||
          error.message.includes('Invalid API type') ||
          error.message.includes('Invalid tone parameter') ||
          error.message.includes('Invalid length parameter')) {
        throw error
      }

      return this._createErrorResponse('SESSION_FAILED', error.message)
    }
  }

  async destroySession (sessionId) {
    const sessionData = this.sessions.get(sessionId)
    if (!sessionData) {
      return false
    }

    try {
      if (sessionData.session && typeof sessionData.session.destroy === 'function') {
        await sessionData.session.destroy()
      }
    } catch (error) {
      console.warn(`Failed to destroy session ${sessionId}:`, error)
    }

    this.sessions.delete(sessionId)
    return true
  }

  // Text analysis methods
  async analyzeText (request) {
    try {
      this._validateAnalysisRequest(request)

      const { text, apiType, parameters = {} } = request
      let result = null

      // Try primary API first
      if (apiType === 'rewriter') {
        result = await this._analyzeWithRewriter(text, parameters)
      } else if (apiType === 'prompt') {
        result = await this._analyzeWithPrompt(text, parameters)
      }

      // If primary API failed and fallback is enabled
      if (!result && this.fallbackEnabled) {
        if (apiType === 'rewriter') {
          console.log('Rewriter failed, falling back to Prompt API')
          result = await this._analyzeWithPrompt(text, parameters)
          if (result) {
            result.apiUsed = 'prompt'
          }
        } else if (apiType === 'prompt') {
          console.log('Prompt failed, falling back to Rewriter API')
          result = await this._analyzeWithRewriter(text, parameters)
          if (result) {
            result.apiUsed = 'rewriter'
          }
        }
      }

      // If both APIs failed
      if (!result) {
        return this._createErrorResponse('API_UNAVAILABLE', 'No AI APIs available for text analysis')
      }

      return result
    } catch (error) {
      if (error.message === 'Text cannot be empty') {
        throw error
      }

      if (error.message === 'TEXT_TOO_LONG') {
        throw error
      }

      return this._createErrorResponse('PROCESSING_ERROR', error.message)
    }
  }

  async _analyzeWithRewriter (text, parameters = {}) {
    if (typeof Rewriter === 'undefined') {
      return null
    }

    try {
      const startTime = Date.now()

      // Create or reuse session
      const rewriterSession = await this._getOrCreateSession('rewriter', parameters)

      // Validate parameters
      const validatedParams = this._validateRewriterParameters(parameters)

      // Perform rewrite
      const improvedText = await rewriterSession.rewrite(text, {
        context: 'Improve text clarity and readability',
        ...validatedParams
      })

      const processingTime = Date.now() - startTime

      return {
        success: true,
        improvedText,
        confidenceScore: this._calculateConfidenceScore(text, improvedText),
        processingTime,
        apiUsed: 'rewriter',
        changes: this._generateChangeDetails(text, improvedText)
      }
    } catch (error) {
      console.error('Rewriter API error:', error)
      return null
    }
  }

  async _analyzeWithPrompt (text, parameters = {}) {
    if (typeof Prompt === 'undefined') {
      return null
    }

    try {
      const startTime = Date.now()

      // Create or reuse session
      const promptSession = await this._getOrCreateSession('prompt', parameters)

      // Create clarity-focused prompt
      const clarityPrompt = this._createClarityPrompt(text, parameters)

      // Perform analysis
      const improvedText = await promptSession.prompt(clarityPrompt)

      const processingTime = Date.now() - startTime

      return {
        success: true,
        improvedText,
        confidenceScore: this._calculateConfidenceScore(text, improvedText),
        processingTime,
        apiUsed: 'prompt',
        changes: this._generateChangeDetails(text, improvedText)
      }
    } catch (error) {
      console.error('Prompt API error:', error)
      return null
    }
  }

  async _getOrCreateSession (apiType, parameters) {
    // Find existing session of the right type
    for (const [sessionId, sessionData] of this.sessions) {
      if (sessionData.apiType === apiType &&
          JSON.stringify(sessionData.parameters) === JSON.stringify(parameters)) {
        sessionData.lastUsed = Date.now()
        return sessionData.session
      }
    }

    // Create new session
    const sessionResponse = await this.createSession({ apiType, defaultParameters: parameters })
    if (!sessionResponse.success) {
      throw new Error(`Failed to create ${apiType} session`)
    }

    const sessionData = this.sessions.get(sessionResponse.sessionId)
    return sessionData.session
  }

  _createClarityPrompt (text, parameters = {}) {
    const tone = parameters.tone || 'neutral'
    const length = parameters.length || 'as-is'

    let prompt = `Please improve the clarity of the following text. Focus on:
- Removing unnecessary words and phrases
- Making the meaning clearer and more direct
- Improving sentence structure for better readability
- Maintaining the original meaning and intent

Text to improve: "${text}"

Please provide only the improved text without any explanations.`

    if (tone === 'more-formal') {
      prompt += '\nUse a more formal tone.'
    } else if (tone === 'more-casual') {
      prompt += '\nUse a more casual tone.'
    }

    if (length === 'shorter') {
      prompt += '\nMake the text more concise.'
    } else if (length === 'longer') {
      prompt += '\nExpand the text for more clarity.'
    }

    return prompt
  }

  // Validation methods
  _validateSessionRequest (request) {
    if (!request || typeof request !== 'object') {
      throw new Error('Missing required parameter: request object')
    }

    if (!request.apiType) {
      throw new Error('Missing required parameter: apiType')
    }

    const validApiTypes = ['rewriter', 'prompt']
    if (!validApiTypes.includes(request.apiType)) {
      throw new Error('Invalid API type')
    }

    if (request.defaultParameters) {
      this._validateParameters(request.defaultParameters)
    }
  }

  _validateAnalysisRequest (request) {
    if (!request || typeof request !== 'object') {
      throw new Error('Invalid request format')
    }

    if (!request.text) {
      throw new Error('Text cannot be empty')
    }

    if (typeof request.text !== 'string') {
      throw new Error('Text must be a string')
    }

    if (request.text.length > 5000) {
      throw new Error('TEXT_TOO_LONG')
    }

    if (!request.apiType) {
      throw new Error('Missing required parameter: apiType')
    }

    if (request.parameters) {
      this._validateParameters(request.parameters)
    }
  }

  _validateParameters (parameters) {
    if (parameters.tone && !['more-formal', 'as-is', 'more-casual'].includes(parameters.tone)) {
      throw new Error('Invalid tone parameter')
    }

    if (parameters.length && !['shorter', 'as-is', 'longer'].includes(parameters.length)) {
      throw new Error('Invalid length parameter')
    }
  }

  _validateRewriterParameters (parameters) {
    const validated = {}

    if (parameters.tone) {
      validated.tone = parameters.tone
    }

    if (parameters.length) {
      validated.length = parameters.length
    }

    if (parameters.format) {
      validated.format = parameters.format
    }

    return validated
  }

  // Helper methods
  _generateSessionId () {
    return `ai_session_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }

  _calculateConfidenceScore (originalText, improvedText) {
    // Simple heuristic for confidence scoring
    if (!originalText || !improvedText) return 0

    const originalWords = originalText.trim().split(/\s+/).length
    const improvedWords = improvedText.trim().split(/\s+/).length

    // Higher confidence if text was meaningfully changed
    const lengthRatio = Math.abs(improvedWords - originalWords) / originalWords
    const similarityScore = this._calculateSimilarity(originalText, improvedText)

    // Balance between change and preservation of meaning
    let confidence = 0.7 // Base confidence

    if (lengthRatio > 0.1) confidence += 0.1 // Meaningful length change
    if (similarityScore > 0.3 && similarityScore < 0.9) confidence += 0.2 // Good balance

    return Math.min(confidence, 1.0)
  }

  _calculateSimilarity (text1, text2) {
    // Simple word-based similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))

    const intersection = new Set([...words1].filter(word => words2.has(word)))
    const union = new Set([...words1, ...words2])

    return intersection.size / union.size
  }

  _generateChangeDetails (originalText, improvedText) {
    // Simple change detection - in a real implementation, this would be more sophisticated
    const changes = []

    if (originalText !== improvedText) {
      changes.push({
        changeType: 'clarity',
        originalPhrase: originalText.length > 50 ? originalText.substring(0, 47) + '...' : originalText,
        improvedPhrase: improvedText.length > 50 ? improvedText.substring(0, 47) + '...' : improvedText,
        reason: 'Overall clarity improvement',
        startPosition: 0,
        endPosition: originalText.length
      })
    }

    return changes
  }

  _createErrorResponse (code, message) {
    return {
      success: false,
      error: {
        code,
        message
      }
    }
  }

  _scheduleSessionCleanup (sessionId) {
    setTimeout(() => {
      const sessionData = this.sessions.get(sessionId)
      if (sessionData && Date.now() - sessionData.lastUsed > this.sessionTimeout) {
        this.destroySession(sessionId)
      }
    }, this.sessionTimeout)
  }

  // Public utility methods
  isApiAvailable (apiType) {
    if (apiType === 'rewriter') {
      return typeof Rewriter !== 'undefined'
    }
    if (apiType === 'prompt') {
      return typeof Prompt !== 'undefined'
    }
    return false
  }

  getAvailableApis () {
    const apis = []
    if (this.isApiAvailable('rewriter')) apis.push('rewriter')
    if (this.isApiAvailable('prompt')) apis.push('prompt')
    return apis
  }

  getSessionCount () {
    return this.sessions.size
  }

  // Cleanup method
  async cleanup () {
    const sessionIds = Array.from(this.sessions.keys())
    await Promise.all(sessionIds.map(id => this.destroySession(id)))
  }
}

// Export singleton instance
module.exports = new AIService()
