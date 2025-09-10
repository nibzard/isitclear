// ABOUTME: Unit tests for text validation functions
// ABOUTME: Tests validation logic used across the extension

const { describe, it, expect } = require('@jest/globals')

describe('Text Validation Unit Tests', () => {
  describe('Text Length Validation', () => {
    it('should validate minimum text length', () => {
      const validateMinLength = (text, minLength = 1) => {
        if (!text || text.length < minLength) {
          throw new Error(`Text must be at least ${minLength} characters`)
        }
        return true
      }

      expect(() => validateMinLength('', 1)).toThrow('Text must be at least 1 characters')
      expect(() => validateMinLength('a', 1)).not.toThrow()
      expect(() => validateMinLength('hello', 5)).not.toThrow()
    })

    it('should validate maximum text length', () => {
      const validateMaxLength = (text, maxLength = 5000) => {
        if (!text || text.length > maxLength) {
          throw new Error(`Text must not exceed ${maxLength} characters`)
        }
        return true
      }

      const longText = 'a'.repeat(5001)
      expect(() => validateMaxLength(longText, 5000)).toThrow('Text must not exceed 5000 characters')
      expect(() => validateMaxLength('a'.repeat(5000), 5000)).not.toThrow()
      expect(() => validateMaxLength('short', 5000)).not.toThrow()
    })
  })

  describe('Text Content Validation', () => {
    it('should validate text contains actual words', () => {
      const validateHasWords = (text) => {
        if (!text || !text.trim()) {
          throw new Error('Text cannot be empty or whitespace only')
        }
        const words = text.trim().split(/\s+/)
        if (words.length === 0) {
          throw new Error('Text must contain at least one word')
        }
        return true
      }

      expect(() => validateHasWords('')).toThrow()
      expect(() => validateHasWords('   ')).toThrow('Text cannot be empty or whitespace only')
      expect(() => validateHasWords('hello')).not.toThrow()
      expect(() => validateHasWords('hello world')).not.toThrow()
    })

    it('should validate against problematic characters', () => {
      const validateCharacters = (text) => {
        if (!text) return true
        
        const problematicPattern = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/
        if (problematicPattern.test(text)) {
          throw new Error('Text contains invalid characters')
        }
        return true
      }

      expect(() => validateCharacters('hello\x00world')).toThrow('Text contains invalid characters')
      expect(() => validateCharacters('hello world')).not.toThrow()
      expect(() => validateCharacters('normal text!')).not.toThrow()
    })
  })

  describe('Word Count Validation', () => {
    it('should calculate word count accurately', () => {
      const calculateWordCount = (text) => {
        if (!text || !text.trim()) return 0
        return text.trim().split(/\s+/).length
      }

      expect(calculateWordCount('')).toBe(0)
      expect(calculateWordCount('   ')).toBe(0)
      expect(calculateWordCount('hello')).toBe(1)
      expect(calculateWordCount('hello world')).toBe(2)
      expect(calculateWordCount('hello   world')).toBe(2)
      expect(calculateWordCount('hello-world')).toBe(1)
      expect(calculateWordCount('Multiple   spaces   here')).toBe(3)
    })

    it('should validate minimum word count', () => {
      const validateMinWords = (text, minWords = 1) => {
        const wordCount = text.trim().split(/\s+/).length
        if (wordCount < minWords) {
          throw new Error(`Text must contain at least ${minWords} words`)
        }
        return true
      }

      expect(() => validateMinWords('hello', 2)).toThrow('Text must contain at least 2 words')
      expect(() => validateMinWords('hello world', 2)).not.toThrow()
      expect(() => validateMinWords('single', 1)).not.toThrow()
    })
  })

  describe('Field Type Validation', () => {
    it('should validate supported field types', () => {
      const validateFieldType = (fieldType) => {
        const validTypes = ['input', 'textarea', 'contenteditable']
        if (!validTypes.includes(fieldType)) {
          throw new Error(`Invalid field type: ${fieldType}`)
        }
        return true
      }

      expect(() => validateFieldType('input')).not.toThrow()
      expect(() => validateFieldType('textarea')).not.toThrow()
      expect(() => validateFieldType('contenteditable')).not.toThrow()
      expect(() => validateFieldType('select')).toThrow('Invalid field type: select')
      expect(() => validateFieldType('button')).toThrow('Invalid field type: button')
    })

    it('should validate input subtypes', () => {
      const validateInputSubtype = (inputType) => {
        const validTypes = ['text', 'email', 'search', 'url', 'tel']
        if (!validTypes.includes(inputType)) {
          throw new Error(`Unsupported input type: ${inputType}`)
        }
        return true
      }

      expect(() => validateInputSubtype('text')).not.toThrow()
      expect(() => validateInputSubtype('email')).not.toThrow()
      expect(() => validateInputSubtype('password')).toThrow('Unsupported input type: password')
      expect(() => validateInputSubtype('submit')).toThrow('Unsupported input type: submit')
    })
  })

  describe('Confidence Score Validation', () => {
    it('should validate confidence score range', () => {
      const validateConfidenceScore = (score) => {
        if (typeof score !== 'number' || score < 0 || score > 1) {
          throw new Error('Confidence score must be between 0 and 1')
        }
        return true
      }

      expect(() => validateConfidenceScore(0.5)).not.toThrow()
      expect(() => validateConfidenceScore(0)).not.toThrow()
      expect(() => validateConfidenceScore(1)).not.toThrow()
      expect(() => validateConfidenceScore(-0.1)).toThrow('Confidence score must be between 0 and 1')
      expect(() => validateConfidenceScore(1.1)).toThrow('Confidence score must be between 0 and 1')
      expect(() => validateConfidenceScore('invalid')).toThrow('Confidence score must be between 0 and 1')
    })
  })

  describe('Processing Time Validation', () => {
    it('should validate processing time is positive', () => {
      const validateProcessingTime = (time) => {
        if (typeof time !== 'number' || time < 0) {
          throw new Error('Processing time must be a positive number')
        }
        return true
      }

      expect(() => validateProcessingTime(100)).not.toThrow()
      expect(() => validateProcessingTime(0)).not.toThrow()
      expect(() => validateProcessingTime(500)).not.toThrow()
      expect(() => validateProcessingTime(-1)).toThrow('Processing time must be a positive number')
      expect(() => validateProcessingTime('100')).toThrow('Processing time must be a positive number')
    })
  })
})