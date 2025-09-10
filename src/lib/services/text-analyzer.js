// ABOUTME: Text analysis service that orchestrates the full text improvement workflow
// ABOUTME: Integrates TextContent, ClarityImprovement models with AI service for complete analysis

const TextContent = require('../models/text-content')
const { ClarityImprovement, ChangeDetail } = require('../models/clarity-improvement')
const AIService = require('./ai-service')

class TextAnalyzer {
  constructor () {
    this.analysisHistory = []
    this.maxHistorySize = 10
  }

  // Main analysis methods
  async createAnalysisResult (analysisData) {
    try {
      this._validateAnalysisData(analysisData)

      // Create ClarityImprovement from the analysis data
      const clarityImprovement = new ClarityImprovement(
        analysisData.improvedText,
        analysisData.improvementType || 'rewriter',
        analysisData.confidenceScore || 0.7,
        this._createChangeDetails(analysisData.changes || []),
        analysisData.processingTime || 0,
        analysisData.apiParameters || {}
      )

      // Store in history
      this._addToHistory(analysisData.originalText, clarityImprovement)

      return {
        originalText: analysisData.originalText,
        improvedText: analysisData.improvedText,
        changes: clarityImprovement.changes.map(change => change.toJSON()),
        confidenceScore: clarityImprovement.confidenceScore,
        processingTime: clarityImprovement.processingTime,
        improvementType: clarityImprovement.improvementType
      }
    } catch (error) {
      throw error
    }
  }

  async analyzeTextContent (textContent, userPreferences = {}) {
    if (!(textContent instanceof TextContent)) {
      throw new Error('textContent must be a TextContent instance')
    }

    if (textContent.isEmpty()) {
      throw new Error('Cannot analyze empty text content')
    }

    try {
      // Update text content state
      textContent.setAnalyzing()

      // Prepare AI analysis request
      const analysisRequest = this._createAnalysisRequest(textContent, userPreferences)

      // Perform AI analysis
      const aiResponse = await AIService.analyzeText(analysisRequest)

      if (!aiResponse || !aiResponse.success) {
        textContent.setRejected()
        throw new Error(aiResponse?.error?.message || 'AI analysis failed')
      }

      // Create clarity improvement
      const clarityImprovement = ClarityImprovement.createFromAIResponse(aiResponse, textContent.originalText)

      // Update text content state
      textContent.setAnalyzed()

      // Create analysis result
      const analysisResult = {
        originalText: textContent.originalText,
        improvedText: clarityImprovement.improvedText,
        changes: clarityImprovement.changes.map(change => change.toJSON()),
        confidenceScore: clarityImprovement.confidenceScore,
        processingTime: clarityImprovement.processingTime,
        improvementType: clarityImprovement.improvementType,
        textContentId: textContent.timestamp.toISOString() // For tracking
      }

      // Store in history
      this._addToHistory(textContent.originalText, clarityImprovement)

      return analysisResult
    } catch (error) {
      textContent.setRejected()
      throw error
    }
  }

  async analyzeText (text, options = {}) {
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required and must be a string')
    }

    if (text.trim().length === 0) {
      throw new Error('Text cannot be empty')
    }

    try {
      // Create temporary TextContent for analysis
      const textContent = new TextContent(
        text,
        options.fieldType || 'textarea',
        options.fieldContext || 'temp-analysis'
      )

      return await this.analyzeTextContent(textContent, options.userPreferences)
    } catch (error) {
      throw error
    }
  }

  _createAnalysisRequest (textContent, userPreferences = {}) {
    // Determine API preference
    const apiType = userPreferences.preferredApi || 'rewriter'

    // Get AI parameters from user preferences
    const parameters = userPreferences.getAIParameters
      ? userPreferences.getAIParameters()
      : this._getDefaultParameters(userPreferences)

    // Add context based on field type and content
    const context = this._buildAnalysisContext(textContent, userPreferences)

    return {
      text: textContent.originalText,
      apiType,
      parameters,
      context
    }
  }

  _getDefaultParameters (preferences = {}) {
    return {
      tone: preferences.preferredTone === 'formal'
        ? 'more-formal'
        : preferences.preferredTone === 'casual' ? 'more-casual' : 'as-is',
      length: 'as-is',
      format: 'plain-text'
    }
  }

  _buildAnalysisContext (textContent, userPreferences = {}) {
    const context = {
      fieldType: textContent.fieldType,
      wordCount: textContent.wordCount,
      isShort: textContent.isShort(),
      isLong: textContent.isLong()
    }

    // Add user preference context
    if (userPreferences.showChangeDetails) {
      context.detailedAnalysis = true
    }

    // Add field-specific context
    if (textContent.fieldContext && textContent.fieldContext.includes('email')) {
      context.purpose = 'email'
    } else if (textContent.fieldContext && textContent.fieldContext.includes('comment')) {
      context.purpose = 'comment'
    } else if (textContent.fieldContext && textContent.fieldContext.includes('message')) {
      context.purpose = 'message'
    }

    return context
  }

  _createChangeDetails (changes) {
    if (!Array.isArray(changes)) {
      return []
    }

    return changes.map(change => {
      if (change instanceof ChangeDetail) {
        return change
      }

      // Validate change object has required properties
      if (!change.changeType || !change.originalPhrase || !change.improvedPhrase) {
        throw new Error('Invalid change object: missing required properties')
      }

      return new ChangeDetail(
        change.changeType,
        change.originalPhrase,
        change.improvedPhrase,
        change.reason || 'Text improvement',
        change.startPosition || 0,
        change.endPosition || change.originalPhrase.length
      )
    })
  }

  _validateAnalysisData (analysisData) {
    if (!analysisData || typeof analysisData !== 'object') {
      throw new Error('analysisData is required and must be an object')
    }

    if (!analysisData.originalText) {
      throw new Error('originalText is required')
    }

    if (!analysisData.improvedText) {
      throw new Error('improvedText is required')
    }

    if (analysisData.changes && !Array.isArray(analysisData.changes)) {
      throw new Error('changes must be an array')
    }

    if (analysisData.confidenceScore !== undefined) {
      if (typeof analysisData.confidenceScore !== 'number' ||
          analysisData.confidenceScore < 0 ||
          analysisData.confidenceScore > 1) {
        throw new Error('confidenceScore must be a number between 0 and 1')
      }
    }

    if (analysisData.processingTime !== undefined) {
      if (typeof analysisData.processingTime !== 'number' || analysisData.processingTime < 0) {
        throw new Error('processingTime must be a non-negative number')
      }
    }
  }

  // History management
  _addToHistory (originalText, clarityImprovement) {
    const historyEntry = {
      originalText,
      clarityImprovement,
      timestamp: new Date(),
      id: this._generateHistoryId()
    }

    this.analysisHistory.unshift(historyEntry)

    // Keep history size manageable
    if (this.analysisHistory.length > this.maxHistorySize) {
      this.analysisHistory = this.analysisHistory.slice(0, this.maxHistorySize)
    }
  }

  _generateHistoryId () {
    return `analysis_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }

  getAnalysisHistory (limit = 10) {
    return this.analysisHistory.slice(0, limit).map(entry => ({
      id: entry.id,
      timestamp: entry.timestamp,
      originalText: entry.originalText.length > 100
        ? entry.originalText.substring(0, 97) + '...'
        : entry.originalText,
      summary: entry.clarityImprovement.getSummary()
    }))
  }

  getHistoryById (id) {
    const entry = this.analysisHistory.find(entry => entry.id === id)
    if (!entry) {
      return null
    }

    return {
      originalText: entry.originalText,
      improvedText: entry.clarityImprovement.improvedText,
      changes: entry.clarityImprovement.changes.map(change => change.toJSON()),
      confidenceScore: entry.clarityImprovement.confidenceScore,
      processingTime: entry.clarityImprovement.processingTime,
      improvementType: entry.clarityImprovement.improvementType,
      timestamp: entry.timestamp
    }
  }

  clearHistory () {
    this.analysisHistory = []
  }

  // Analysis quality assessment
  assessAnalysisQuality (analysisResult) {
    if (!analysisResult || !analysisResult.improvedText) {
      return { quality: 'poor', reasons: ['No improved text provided'] }
    }

    const reasons = []
    let quality = 'good'

    // Check confidence score
    if (analysisResult.confidenceScore < 0.6) {
      quality = 'poor'
      reasons.push('Low confidence score')
    } else if (analysisResult.confidenceScore < 0.8) {
      quality = 'medium'
      reasons.push('Medium confidence score')
    }

    // Check processing time
    if (analysisResult.processingTime > 2000) {
      reasons.push('Slow processing time')
    }

    // Check text changes
    if (analysisResult.originalText === analysisResult.improvedText) {
      quality = 'poor'
      reasons.push('No changes made to text')
    }

    // Check change details
    if (!analysisResult.changes || analysisResult.changes.length === 0) {
      reasons.push('No specific changes documented')
    }

    // Check for meaningful improvement
    const originalLength = analysisResult.originalText.length
    const improvedLength = analysisResult.improvedText.length
    const lengthDifference = Math.abs(originalLength - improvedLength)
    const lengthChangePercent = lengthDifference / originalLength

    if (lengthChangePercent > 0.5) {
      reasons.push('Significant length change - may have altered meaning')
    }

    return { quality, reasons }
  }

  // Batch analysis methods
  async analyzeBatch (textItems, options = {}) {
    if (!Array.isArray(textItems)) {
      throw new Error('textItems must be an array')
    }

    const results = []
    const maxConcurrent = options.maxConcurrent || 3

    // Process in batches to avoid overwhelming the AI service
    for (let i = 0; i < textItems.length; i += maxConcurrent) {
      const batch = textItems.slice(i, i + maxConcurrent)

      const batchPromises = batch.map(async (textItem, index) => {
        try {
          const result = await this.analyzeText(textItem.text, {
            ...options,
            fieldType: textItem.fieldType,
            fieldContext: textItem.fieldContext || `batch-${i + index}`
          })

          return {
            success: true,
            index: i + index,
            result,
            originalItem: textItem
          }
        } catch (error) {
          return {
            success: false,
            index: i + index,
            error: error.message,
            originalItem: textItem
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Add small delay between batches to be respectful to the AI service
      if (i + maxConcurrent < textItems.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return results
  }

  // Statistics and insights
  getAnalysisStatistics () {
    if (this.analysisHistory.length === 0) {
      return {
        totalAnalyses: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        improvementTypes: {},
        changeTypes: {}
      }
    }

    const confidenceScores = this.analysisHistory.map(entry => entry.clarityImprovement.confidenceScore)
    const processingTimes = this.analysisHistory.map(entry => entry.clarityImprovement.processingTime)
    const improvementTypes = {}
    const changeTypes = {}

    this.analysisHistory.forEach(entry => {
      const type = entry.clarityImprovement.improvementType
      improvementTypes[type] = (improvementTypes[type] || 0) + 1

      entry.clarityImprovement.changes.forEach(change => {
        changeTypes[change.changeType] = (changeTypes[change.changeType] || 0) + 1
      })
    })

    return {
      totalAnalyses: this.analysisHistory.length,
      averageConfidence: confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length,
      averageProcessingTime: processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length,
      improvementTypes,
      changeTypes
    }
  }
}

// Export singleton instance
module.exports = new TextAnalyzer()
