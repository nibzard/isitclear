// ABOUTME: TextContent model for representing original text content from user input fields
// ABOUTME: Handles validation, state transitions, and text content management

class TextContent {
  constructor (originalText, fieldType, fieldContext) {
    this.originalText = originalText
    this.fieldType = fieldType
    this.fieldContext = fieldContext
    this.timestamp = new Date()
    this.wordCount = this._calculateWordCount(originalText)
    this.state = 'Created'

    this._validate()
  }

  _validate () {
    if (!this.originalText && this.originalText !== '') {
      throw new Error('originalText is required')
    }

    if (this.originalText.length === 0) {
      throw new Error('originalText must not be empty (minimum 1 character)')
    }

    if (this.originalText.length > 5000) {
      throw new Error('originalText maximum length is 5000 characters (based on AI model limits)')
    }

    const validFieldTypes = ['input', 'textarea', 'contenteditable']
    if (!validFieldTypes.includes(this.fieldType)) {
      throw new Error('fieldType must be one of the three supported types: input, textarea, contenteditable')
    }

    if (!this.fieldContext) {
      throw new Error('fieldContext must be a valid CSS selector')
    }

    // Basic CSS selector validation
    if (typeof this.fieldContext !== 'string' || this.fieldContext.trim().length === 0) {
      throw new Error('fieldContext must be a valid CSS selector')
    }
  }

  _calculateWordCount (text) {
    if (!text || typeof text !== 'string') return 0

    // Split by whitespace and filter out empty strings
    const words = text.trim().split(/\s+/).filter(word => word.length > 0)
    return words.length
  }

  // State transition methods
  setAnalyzing () {
    if (this.state !== 'Created') {
      throw new Error(`Cannot transition to Analyzing from ${this.state}`)
    }
    this.state = 'Analyzing'
  }

  setAnalyzed () {
    if (this.state !== 'Analyzing') {
      throw new Error(`Cannot transition to Analyzed from ${this.state}`)
    }
    this.state = 'Analyzed'
  }

  setAccepted () {
    if (this.state !== 'Analyzed') {
      throw new Error(`Cannot transition to Accepted from ${this.state}`)
    }
    this.state = 'Accepted'
  }

  setRejected () {
    if (this.state !== 'Analyzed') {
      throw new Error(`Cannot transition to Rejected from ${this.state}`)
    }
    this.state = 'Rejected'
  }

  // Utility methods
  isEmpty () {
    return this.originalText.trim().length === 0
  }

  isShort () {
    return this.wordCount < 3
  }

  isLong () {
    return this.wordCount > 200
  }

  getExcerpt (maxLength = 50) {
    if (this.originalText.length <= maxLength) {
      return this.originalText
    }
    return this.originalText.substring(0, maxLength) + '...'
  }

  // Serialization methods
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

  static fromJSON (data) {
    const textContent = new TextContent(data.originalText, data.fieldType, data.fieldContext)
    textContent.timestamp = new Date(data.timestamp)
    textContent.wordCount = data.wordCount
    textContent.state = data.state
    return textContent
  }

  // Static factory methods
  static createFromElement (element) {
    let originalText = ''
    let fieldType = ''

    if (element.tagName.toLowerCase() === 'textarea') {
      fieldType = 'textarea'
      originalText = element.value || ''
    } else if (element.tagName.toLowerCase() === 'input' && element.type === 'text') {
      fieldType = 'input'
      originalText = element.value || ''
    } else if (element.contentEditable === 'true') {
      fieldType = 'contenteditable'
      originalText = element.textContent || element.innerText || ''
    } else {
      throw new Error('Element is not a valid input field')
    }

    // Generate CSS selector for the element
    const fieldContext = TextContent._generateSelector(element)

    return new TextContent(originalText, fieldType, fieldContext)
  }

  static _generateSelector (element) {
    // Simple selector generation - prefer ID, then class, then tag with position
    if (element.id) {
      return `#${element.id}`
    }

    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim().length > 0)
      if (classes.length > 0) {
        return `.${classes[0]}`
      }
    }

    // Fallback to tag name with sibling index
    const tagName = element.tagName.toLowerCase()
    const siblings = Array.from(element.parentNode.children).filter(
      sibling => sibling.tagName.toLowerCase() === tagName
    )

    if (siblings.length === 1) {
      return tagName
    }

    const index = siblings.indexOf(element)
    return `${tagName}:nth-child(${index + 1})`
  }

  // Validation helper
  static isValidFieldType (fieldType) {
    return ['input', 'textarea', 'contenteditable'].includes(fieldType)
  }
}

module.exports = TextContent
