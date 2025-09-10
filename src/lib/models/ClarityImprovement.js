// ABOUTME: ClarityImprovement model representing AI-generated text improvements
// ABOUTME: Tracks changes, confidence scores, and relationships to original text

export class ClarityImprovement {
  constructor (data) {
    this.validateInput(data)

    this.improvedText = data.improvedText
    this.improvementType = data.improvementType
    this.confidenceScore = data.confidenceScore
    this.changes = data.changes.map(change => new ChangeDetail(change))
    this.processingTime = data.processingTime
    this.apiParameters = data.apiParameters || {}
    this.timestamp = new Date()
  }

  validateInput (data) {
    if (!data.improvedText || typeof data.improvedText !== 'string') {
      throw new Error('Improved text is required')
    }

    if (!['rewriter', 'prompt'].includes(data.improvementType)) {
      throw new Error('Invalid improvement type')
    }

    if (typeof data.confidenceScore !== 'number' || data.confidenceScore < 0 || data.confidenceScore > 1) {
      throw new Error('Confidence score must be between 0 and 1')
    }

    if (!Array.isArray(data.changes) || data.changes.length === 0) {
      throw new Error('Changes array must contain at least one change')
    }

    if (typeof data.processingTime !== 'number' || data.processingTime <= 0) {
      throw new Error('Processing time must be a positive number')
    }
  }

  getChangesSummary () {
    const summary = {
      'word-choice': 0,
      'sentence-structure': 0,
      clarity: 0,
      conciseness: 0
    }

    this.changes.forEach(change => {
      summary[change.changeType]++
    })

    return summary
  }

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
}

export class ChangeDetail {
  constructor (data) {
    this.validateInput(data)

    this.changeType = data.changeType
    this.originalPhrase = data.originalPhrase
    this.improvedPhrase = data.improvedPhrase
    this.reason = data.reason
    this.startPosition = data.startPosition
    this.endPosition = data.endPosition
  }

  validateInput (data) {
    if (!['word-choice', 'sentence-structure', 'clarity', 'conciseness'].includes(data.changeType)) {
      throw new Error('Invalid change type')
    }

    if (!data.originalPhrase || !data.improvedPhrase) {
      throw new Error('Original and improved phrases are required')
    }

    if (data.originalPhrase === data.improvedPhrase) {
      throw new Error('Original and improved phrases must be different')
    }

    if (!data.reason || typeof data.reason !== 'string') {
      throw new Error('Reason is required')
    }

    if (typeof data.startPosition !== 'number' || typeof data.endPosition !== 'number') {
      throw new Error('Start and end positions must be numbers')
    }

    if (data.startPosition >= data.endPosition) {
      throw new Error('End position must be greater than start position')
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
}

export function validateClarityAnalysisResult (result) {
  if (!result.originalText) {
    throw new Error('Original text is required')
  }

  if (!result.improvedText) {
    throw new Error('Improved text is required')
  }

  if (!Array.isArray(result.changes)) {
    throw new Error('Changes must be an array')
  }

  if (typeof result.confidenceScore === 'number' && (result.confidenceScore < 0 || result.confidenceScore > 1)) {
    throw new Error('Confidence score must be between 0 and 1')
  }

  return true
}

export function validateTextChange (change) {
  if (!['word-choice', 'sentence-structure', 'clarity', 'conciseness'].includes(change.changeType)) {
    throw new Error('Invalid change type')
  }

  if (!change.originalPhrase || !change.improvedPhrase) {
    throw new Error('Original and improved phrases are required')
  }

  if (typeof change.startPosition === 'number' && typeof change.endPosition === 'number' && change.startPosition >= change.endPosition) {
    throw new Error('End position must be greater than start position')
  }

  return true
}
