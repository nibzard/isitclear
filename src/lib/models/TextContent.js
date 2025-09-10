// ABOUTME: TextContent model representing original text from user input fields
// ABOUTME: Handles validation, state transitions, and field context management

export class TextContent {
  constructor (data) {
    this.validateInput(data)

    this.originalText = data.originalText
    this.fieldType = data.fieldType
    this.fieldContext = data.fieldContext
    this.timestamp = data.timestamp || new Date()
    this.wordCount = this.calculateWordCount(this.originalText)
    this.state = 'created'
  }

  validateInput (data) {
    if (!data.originalText || typeof data.originalText !== 'string') {
      throw new Error('Original text is required and must be a string')
    }

    if (data.originalText.length === 0) {
      throw new Error('Original text must not be empty')
    }

    if (data.originalText.length > 5000) {
      throw new Error('Original text exceeds maximum length of 5000 characters')
    }

    if (!['input', 'textarea', 'contenteditable'].includes(data.fieldType)) {
      throw new Error('Field type must be one of: input, textarea, contenteditable')
    }

    if (!data.fieldContext || typeof data.fieldContext !== 'string') {
      throw new Error('Field context must be a valid CSS selector')
    }
  }

  calculateWordCount (text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  transitionTo (newState) {
    const validTransitions = {
      created: ['analyzing'],
      analyzing: ['analyzed'],
      analyzed: ['accepted', 'rejected']
    }

    if (!validTransitions[this.state] || !validTransitions[this.state].includes(newState)) {
      throw new Error(`Invalid state transition from ${this.state} to ${newState}`)
    }

    this.state = newState
  }

  isAnalyzable () {
    return this.state === 'created' && this.wordCount >= 1 && this.originalText.length <= 5000
  }

  toJSON () {
    return {
      originalText: this.originalText,
      fieldType: this.fieldType,
      fieldContext: this.fieldContext,
      timestamp: this.timestamp.toISOString(),
      wordCount: this.wordCount,
      state: this.state
    }
  }

  static fromJSON (json) {
    const data = {
      ...json,
      timestamp: new Date(json.timestamp)
    }
    const textContent = new TextContent(data)
    textContent.state = json.state
    return textContent
  }
}

export function validateInputFieldData (data) {
  if (!data.element || typeof data.element !== 'string') {
    throw new Error('Element is required')
  }

  if (!['input', 'textarea', 'contenteditable'].includes(data.fieldType)) {
    throw new Error('Invalid field type')
  }

  if (typeof data.text !== 'string') {
    throw new Error('Text must be a string')
  }

  return true
}
