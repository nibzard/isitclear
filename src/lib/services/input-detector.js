// ABOUTME: Input field detection service for identifying and working with text input elements
// ABOUTME: Handles DOM interaction, field validation, and cursor/selection management

const TextContent = require('../models/text-content')

class InputDetector {
  constructor () {
    this.supportedSelectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="search"]',
      'input:not([type])', // Default input type is text
      'textarea',
      '[contenteditable="true"]',
      '[contenteditable=""]' // Empty contenteditable defaults to true
    ]
    this.excludedSelectors = [
      'input[type="password"]',
      'input[type="hidden"]',
      'input[type="submit"]',
      'input[type="button"]',
      'input[type="reset"]',
      'input[readonly]',
      'textarea[readonly]',
      '[contenteditable="false"]'
    ]
  }

  // Main detection methods
  async detectField (element) {
    try {
      if (!element || !element.nodeType) {
        throw new Error('Element is not a valid DOM element')
      }

      if (!this.isValidInputField(element)) {
        throw new Error('Element is not a valid input field')
      }

      const fieldData = await this._extractFieldData(element)
      return fieldData
    } catch (error) {
      throw error
    }
  }

  isValidInputField (element) {
    if (!element || !element.nodeType) {
      return false
    }

    // Check if element matches excluded selectors
    for (const selector of this.excludedSelectors) {
      if (element.matches && element.matches(selector)) {
        return false
      }
    }

    // Check if element matches supported selectors
    for (const selector of this.supportedSelectors) {
      if (element.matches && element.matches(selector)) {
        return true
      }
    }

    return false
  }

  async _extractFieldData (element) {
    const fieldType = this._determineFieldType(element)
    const text = this._extractText(element)
    const selector = this._generateSelector(element)

    // Get cursor and selection information
    const cursorInfo = this._getCursorInfo(element)

    return {
      element: selector,
      fieldType,
      text,
      cursorPosition: cursorInfo.cursorPosition,
      selectionStart: cursorInfo.selectionStart,
      selectionEnd: cursorInfo.selectionEnd
    }
  }

  _determineFieldType (element) {
    const tagName = element.tagName.toLowerCase()

    if (tagName === 'textarea') {
      return 'textarea'
    }

    if (tagName === 'input') {
      return 'input'
    }

    if (element.contentEditable === 'true' || element.contentEditable === '') {
      return 'contenteditable'
    }

    // Fallback
    if (element.isContentEditable) {
      return 'contenteditable'
    }

    return 'input' // Default fallback
  }

  _extractText (element) {
    const fieldType = this._determineFieldType(element)

    if (fieldType === 'textarea' || fieldType === 'input') {
      return element.value || ''
    }

    if (fieldType === 'contenteditable') {
      // For contenteditable, prefer textContent for plain text
      return element.textContent || element.innerText || ''
    }

    return ''
  }

  _getCursorInfo (element) {
    const fieldType = this._determineFieldType(element)

    if (fieldType === 'textarea' || fieldType === 'input') {
      try {
        return {
          cursorPosition: element.selectionStart || 0,
          selectionStart: element.selectionStart || 0,
          selectionEnd: element.selectionEnd || 0
        }
      } catch (error) {
        // Some input types don't support selection
        return {
          cursorPosition: 0,
          selectionStart: 0,
          selectionEnd: 0
        }
      }
    }

    if (fieldType === 'contenteditable') {
      try {
        const selection = window.getSelection()
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          return {
            cursorPosition: range.startOffset,
            selectionStart: range.startOffset,
            selectionEnd: range.endOffset
          }
        }
      } catch (error) {
        console.warn('Failed to get selection info:', error)
      }
    }

    return {
      cursorPosition: 0,
      selectionStart: 0,
      selectionEnd: 0
    }
  }

  _generateSelector (element) {
    // Generate CSS selector for element identification
    if (element.id) {
      return `#${element.id}`
    }

    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ')
        .filter(cls => cls.trim().length > 0)
        .slice(0, 2) // Use max 2 classes to avoid overly specific selectors

      if (classes.length > 0) {
        return `.${classes.join('.')}`
      }
    }

    // Use name attribute if available
    if (element.name) {
      return `${element.tagName.toLowerCase()}[name="${element.name}"]`
    }

    // Use placeholder as identifier
    if (element.placeholder) {
      return `${element.tagName.toLowerCase()}[placeholder="${element.placeholder}"]`
    }

    // Fallback to tag name with sibling position
    const tagName = element.tagName.toLowerCase()
    const parent = element.parentNode

    if (parent) {
      const siblings = Array.from(parent.children)
        .filter(sibling => sibling.tagName.toLowerCase() === tagName)

      if (siblings.length === 1) {
        return tagName
      }

      const index = siblings.indexOf(element)
      return `${tagName}:nth-of-type(${index + 1})`
    }

    return tagName
  }

  // Field discovery methods
  findAllInputFields (rootElement = document) {
    const selector = this.supportedSelectors.join(', ')
    const elements = rootElement.querySelectorAll(selector)

    return Array.from(elements).filter(element => {
      // Double-check with our validation logic
      return this.isValidInputField(element)
    })
  }

  findInputFieldsInViewport () {
    const allFields = this.findAllInputFields()

    return allFields.filter(element => {
      return this.isElementInViewport(element)
    })
  }

  isElementInViewport (element) {
    const rect = element.getBoundingClientRect()
    const windowHeight = window.innerHeight || document.documentElement.clientHeight
    const windowWidth = window.innerWidth || document.documentElement.clientWidth

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= windowHeight &&
      rect.right <= windowWidth &&
      rect.width > 0 &&
      rect.height > 0
    )
  }

  // Text replacement methods
  async replaceText (element, newText, preserveCursor = true) {
    if (!this.isValidInputField(element)) {
      throw new Error('Element is not a valid input field')
    }

    const fieldType = this._determineFieldType(element)
    const originalCursorPos = preserveCursor ? this._getCursorInfo(element).cursorPosition : 0

    if (fieldType === 'textarea' || fieldType === 'input') {
      element.value = newText

      if (preserveCursor) {
        // Adjust cursor position if new text is shorter
        const newCursorPos = Math.min(originalCursorPos, newText.length)
        try {
          element.setSelectionRange(newCursorPos, newCursorPos)
        } catch (error) {
          // Some input types don't support setSelectionRange
        }
      }

      // Trigger input event to notify other scripts
      element.dispatchEvent(new Event('input', { bubbles: true }))
    } else if (fieldType === 'contenteditable') {
      element.textContent = newText

      if (preserveCursor) {
        try {
          // Set cursor position in contenteditable
          const range = document.createRange()
          const selection = window.getSelection()

          if (element.firstChild) {
            const newCursorPos = Math.min(originalCursorPos, newText.length)
            range.setStart(element.firstChild, newCursorPos)
            range.setEnd(element.firstChild, newCursorPos)
            selection.removeAllRanges()
            selection.addRange(range)
          }
        } catch (error) {
          console.warn('Failed to restore cursor position:', error)
        }
      }

      // Trigger input event
      element.dispatchEvent(new Event('input', { bubbles: true }))
    }

    // Trigger change event as well
    element.dispatchEvent(new Event('change', { bubbles: true }))
  }

  // Event handling setup
  setupFieldDetection (callback, options = {}) {
    const {
      detectOnFocus = true,
      detectOnInput = false,
      debounceMs = 100
    } = options

    let debounceTimer = null

    const handleEvent = async (event) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      debounceTimer = setTimeout(async () => {
        const element = event.target

        if (this.isValidInputField(element)) {
          try {
            const fieldData = await this.detectField(element)
            callback(fieldData, element)
          } catch (error) {
            console.warn('Field detection error:', error)
          }
        }
      }, debounceMs)
    }

    // Set up event listeners
    if (detectOnFocus) {
      document.addEventListener('focusin', handleEvent, true)
    }

    if (detectOnInput) {
      document.addEventListener('input', handleEvent, true)
    }

    // Return cleanup function
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      document.removeEventListener('focusin', handleEvent, true)
      document.removeEventListener('input', handleEvent, true)
    }
  }

  // Context analysis methods
  getFieldContext (element) {
    const context = {
      fieldType: this._determineFieldType(element),
      selector: this._generateSelector(element),
      isVisible: this.isElementInViewport(element),
      parentForm: element.closest('form'),
      labels: this.getAssociatedLabels(element),
      placeholder: element.placeholder || '',
      name: element.name || '',
      id: element.id || '',
      className: element.className || ''
    }

    // Detect likely field purpose from context
    context.purpose = this._inferFieldPurpose(element, context)

    return context
  }

  getAssociatedLabels (element) {
    const labels = []

    // Find labels by 'for' attribute
    if (element.id) {
      const labelElements = document.querySelectorAll(`label[for="${element.id}"]`)
      labels.push(...Array.from(labelElements).map(label => label.textContent.trim()))
    }

    // Find parent labels
    const parentLabel = element.closest('label')
    if (parentLabel) {
      labels.push(parentLabel.textContent.replace(element.value || '', '').trim())
    }

    return labels
  }

  _inferFieldPurpose (element, context) {
    const indicators = [
      context.placeholder?.toLowerCase() || '',
      context.name?.toLowerCase() || '',
      context.id?.toLowerCase() || '',
      ...context.labels.map(label => label.toLowerCase())
    ].join(' ')

    if (indicators.includes('email')) return 'email'
    if (indicators.includes('message') || indicators.includes('comment') || indicators.includes('feedback')) return 'message'
    if (indicators.includes('search')) return 'search'
    if (indicators.includes('title') || indicators.includes('subject')) return 'title'
    if (indicators.includes('description') || indicators.includes('bio')) return 'description'
    if (indicators.includes('name')) return 'name'

    return 'general'
  }

  // Utility methods
  createTextContent (element) {
    if (!this.isValidInputField(element)) {
      throw new Error('Element is not a valid input field')
    }

    return TextContent.createFromElement(element)
  }

  async waitForFieldStability (element, timeoutMs = 1000) {
    const startText = this._extractText(element)
    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      const checkStability = () => {
        const currentText = this._extractText(element)
        const elapsed = Date.now() - startTime

        if (elapsed > timeoutMs) {
          resolve(currentText)
          return
        }

        if (currentText === startText) {
          setTimeout(checkStability, 100)
        } else {
          // Text changed, reset timer
          setTimeout(() => this.waitForFieldStability(element, timeoutMs - elapsed), 100)
        }
      }

      checkStability()
    })
  }
}

// Export singleton instance
module.exports = new InputDetector()
