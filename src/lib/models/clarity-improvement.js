// ABOUTME: ClarityImprovement model for AI-generated improved text versions
// ABOUTME: Manages improvement data, changes tracking, and confidence scoring

class ChangeDetail {
  constructor (changeType, originalPhrase, improvedPhrase, reason, startPosition, endPosition) {
    this.changeType = changeType
    this.originalPhrase = originalPhrase
    this.improvedPhrase = improvedPhrase
    this.reason = reason
    this.startPosition = startPosition
    this.endPosition = endPosition

    this._validate()
  }

  _validate () {
    const validChangeTypes = ['word-choice', 'sentence-structure', 'clarity', 'conciseness']
    if (!validChangeTypes.includes(this.changeType)) {
      throw new Error(`Invalid change type: ${this.changeType}. Must be one of: ${validChangeTypes.join(', ')}`)
    }

    if (!this.originalPhrase || typeof this.originalPhrase !== 'string') {
      throw new Error('originalPhrase is required and must be a string')
    }

    if (!this.improvedPhrase || typeof this.improvedPhrase !== 'string') {
      throw new Error('improvedPhrase is required and must be a string')
    }

    if (this.originalPhrase === this.improvedPhrase) {
      throw new Error('originalPhrase and improvedPhrase must not be identical')
    }

    if (!this.reason || typeof this.reason !== 'string') {
      throw new Error('reason is required and must be a string')
    }

    if (typeof this.startPosition !== 'number' || this.startPosition < 0) {
      throw new Error('startPosition must be a non-negative number')
    }

    if (typeof this.endPosition !== 'number' || this.endPosition < 0) {
      throw new Error('endPosition must be a non-negative number')
    }

    if (this.startPosition >= this.endPosition) {
      throw new Error('startPosition must be less than endPosition')
    }
  }

  toJSON () {
    return {
      changeType: this.changeType,
      originalPhrase: this.originalPhrase,
      improvedPhrase: this.improvedPhrase,
      reason: this.reason,
      startPosition: this.startPosition,
      endPosition: this.endPosition
    }
  }

  static fromJSON (data) {
    return new ChangeDetail(
      data.changeType,
      data.originalPhrase,
      data.improvedPhrase,
      data.reason,
      data.startPosition,
      data.endPosition
    )
  }
}

class ClarityImprovement {
  constructor (improvedText, improvementType, confidenceScore, changes, processingTime, apiParameters = {}) {
    this.improvedText = improvedText
    this.improvementType = improvementType
    this.confidenceScore = confidenceScore
    this.changes = changes || []
    this.processingTime = processingTime
    this.apiParameters = apiParameters
    this.timestamp = new Date()

    this._validate()
  }

  _validate () {
    if (!this.improvedText || typeof this.improvedText !== 'string') {
      throw new Error('improvedText is required and must not be empty')
    }

    const validImprovementTypes = ['rewriter', 'prompt']
    if (!validImprovementTypes.includes(this.improvementType)) {
      throw new Error(`improvementType must be one of: ${validImprovementTypes.join(', ')}`)
    }

    if (typeof this.confidenceScore !== 'number' || this.confidenceScore < 0 || this.confidenceScore > 1) {
      throw new Error('confidenceScore must be a number between 0 and 1')
    }

    if (!Array.isArray(this.changes)) {
      throw new Error('changes must be an array')
    }

    if (this.changes.length === 0) {
      throw new Error('changes array must contain at least one change')
    }

    // Validate each change detail
    this.changes.forEach((change, index) => {
      if (!(change instanceof ChangeDetail)) {
        throw new Error(`Change at index ${index} must be a ChangeDetail instance`)
      }
    })

    if (typeof this.processingTime !== 'number' || this.processingTime <= 0) {
      throw new Error('processingTime must be a positive number')
    }

    if (typeof this.apiParameters !== 'object' || this.apiParameters === null) {
      throw new Error('apiParameters must be an object')
    }
  }

  // Quality assessment methods
  isHighConfidence () {
    return this.confidenceScore >= 0.8
  }

  isMediumConfidence () {
    return this.confidenceScore >= 0.6 && this.confidenceScore < 0.8
  }

  isLowConfidence () {
    return this.confidenceScore < 0.6
  }

  isQuickProcessing () {
    return this.processingTime < 500 // Under 500ms
  }

  hasSignificantChanges () {
    return this.changes.some(change =>
      change.changeType === 'sentence-structure' ||
      change.changeType === 'clarity'
    )
  }

  // Text analysis methods
  getReductionPercentage (originalText) {
    if (!originalText || typeof originalText !== 'string') {
      return 0
    }

    const originalLength = originalText.length
    const improvedLength = this.improvedText.length

    if (originalLength === 0) return 0

    return Math.round(((originalLength - improvedLength) / originalLength) * 100)
  }

  getWordCountReduction (originalText) {
    if (!originalText) return 0

    const originalWords = originalText.trim().split(/\s+/).length
    const improvedWords = this.improvedText.trim().split(/\s+/).length

    return originalWords - improvedWords
  }

  getSummary () {
    const changeTypes = [...new Set(this.changes.map(c => c.changeType))]
    const primaryImprovement = changeTypes[0] || 'general'

    return {
      primaryImprovement,
      changeCount: this.changes.length,
      confidenceLevel: this.isHighConfidence() ? 'high' : this.isMediumConfidence() ? 'medium' : 'low',
      processingSpeed: this.isQuickProcessing() ? 'fast' : 'normal'
    }
  }

  // Change analysis methods
  getChangesByType (changeType) {
    return this.changes.filter(change => change.changeType === changeType)
  }

  getMostSignificantChange () {
    if (this.changes.length === 0) return null

    // Prioritize by impact: sentence-structure > clarity > word-choice > conciseness
    const priorityOrder = ['sentence-structure', 'clarity', 'word-choice', 'conciseness']

    for (const type of priorityOrder) {
      const changes = this.getChangesByType(type)
      if (changes.length > 0) {
        // Return the longest change of this type
        return changes.reduce((longest, current) =>
          current.originalPhrase.length > longest.originalPhrase.length ? current : longest
        )
      }
    }

    return this.changes[0]
  }

  // Serialization methods
  toJSON () {
    return {
      improvedText: this.improvedText,
      improvementType: this.improvementType,
      confidenceScore: this.confidenceScore,
      changes: this.changes.map(change => change.toJSON()),
      processingTime: this.processingTime,
      apiParameters: this.apiParameters,
      timestamp: this.timestamp.toISOString()
    }
  }

  static fromJSON (data) {
    const changes = data.changes.map(changeData => ChangeDetail.fromJSON(changeData))

    const improvement = new ClarityImprovement(
      data.improvedText,
      data.improvementType,
      data.confidenceScore,
      changes,
      data.processingTime,
      data.apiParameters
    )

    improvement.timestamp = new Date(data.timestamp)
    return improvement
  }

  // Static factory methods
  static createFromAIResponse (aiResponse, originalText) {
    if (!aiResponse || !aiResponse.success) {
      throw new Error('Invalid AI response')
    }

    // Auto-generate changes if not provided
    let changes = aiResponse.changes || []

    if (changes.length === 0) {
      // Create a simple change representing the overall improvement
      changes = [new ChangeDetail(
        'clarity',
        originalText,
        aiResponse.improvedText,
        'Overall clarity improvement',
        0,
        originalText.length
      )]
    } else {
      // Convert plain objects to ChangeDetail instances
      changes = changes.map(change => {
        if (change instanceof ChangeDetail) {
          return change
        }
        return new ChangeDetail(
          change.changeType,
          change.originalPhrase,
          change.improvedPhrase,
          change.reason,
          change.startPosition,
          change.endPosition
        )
      })
    }

    return new ClarityImprovement(
      aiResponse.improvedText,
      aiResponse.apiUsed || aiResponse.improvementType || 'rewriter',
      aiResponse.confidenceScore || 0.7,
      changes,
      aiResponse.processingTime || 0,
      aiResponse.apiParameters || {}
    )
  }

  // Validation helpers
  static isValidImprovementType (type) {
    return ['rewriter', 'prompt'].includes(type)
  }

  static isValidChangeType (type) {
    return ['word-choice', 'sentence-structure', 'clarity', 'conciseness'].includes(type)
  }
}

module.exports = { ClarityImprovement, ChangeDetail }
