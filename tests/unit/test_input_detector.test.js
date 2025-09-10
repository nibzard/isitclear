// ABOUTME: Unit tests for InputDetector edge cases and validation
// ABOUTME: Tests input field detection logic in isolation

const { describe, it, expect, beforeEach } = require('@jest/globals')
const { InputDetector } = require('../../src/lib/services/input-detector.js')

describe('InputDetector Unit Tests', () => {
  let inputDetector

  beforeEach(() => {
    inputDetector = new InputDetector()
  })

  describe('Input Field Validation', () => {
    it('should validate text input elements', () => {
      const mockElement = {
        tagName: 'INPUT',
        type: 'text',
        value: 'test content'
      }

      const isValid = inputDetector.isValidInputField(mockElement)
      expect(isValid).toBe(true)
    })

    it('should validate textarea elements', () => {
      const mockElement = {
        tagName: 'TEXTAREA',
        value: 'test content'
      }

      const isValid = inputDetector.isValidInputField(mockElement)
      expect(isValid).toBe(true)
    })

    it('should validate contenteditable elements', () => {
      const mockElement = {
        tagName: 'DIV',
        isContentEditable: true,
        innerText: 'test content'
      }

      const isValid = inputDetector.isValidInputField(mockElement)
      expect(isValid).toBe(true)
    })

    it('should reject invalid input types', () => {
      const mockElement = {
        tagName: 'INPUT',
        type: 'submit',
        value: 'Submit'
      }

      const isValid = inputDetector.isValidInputField(mockElement)
      expect(isValid).toBe(false)
    })

    it('should reject non-input elements', () => {
      const mockElement = {
        tagName: 'DIV',
        innerText: 'some text'
      }

      const isValid = inputDetector.isValidInputField(mockElement)
      expect(isValid).toBe(false)
    })
  })

  describe('Field Data Extraction', () => {
    it('should extract data from text input', async () => {
      const mockElement = {
        tagName: 'INPUT',
        type: 'text',
        value: 'Hello world',
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 30 })
      }

      const fieldData = await inputDetector._extractFieldData(mockElement)

      expect(fieldData).toMatchObject({
        fieldType: 'input',
        originalText: 'Hello world',
        wordCount: 2
      })
    })

    it('should extract data from textarea', async () => {
      const mockElement = {
        tagName: 'TEXTAREA',
        value: 'Multi-line text\nsecond line',
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 300, height: 100 })
      }

      const fieldData = await inputDetector._extractFieldData(mockElement)

      expect(fieldData).toMatchObject({
        fieldType: 'textarea',
        originalText: 'Multi-line text\nsecond line',
        wordCount: 5
      })
    })

    it('should extract data from contenteditable', async () => {
      const mockElement = {
        tagName: 'DIV',
        isContentEditable: true,
        innerText: 'Content editable text',
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 50 })
      }

      const fieldData = await inputDetector._extractFieldData(mockElement)

      expect(fieldData).toMatchObject({
        fieldType: 'contenteditable',
        originalText: 'Content editable text',
        wordCount: 3
      })
    })

    it('should handle empty field values', async () => {
      const mockElement = {
        tagName: 'INPUT',
        type: 'text',
        value: '',
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 30 })
      }

      const fieldData = await inputDetector._extractFieldData(mockElement)

      expect(fieldData).toMatchObject({
        fieldType: 'input',
        originalText: '',
        wordCount: 0
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle elements without bounding rect', async () => {
      const mockElement = {
        tagName: 'INPUT',
        type: 'text',
        value: 'test',
        getBoundingClientRect: () => null
      }

      const fieldData = await inputDetector._extractFieldData(mockElement)

      expect(fieldData).toMatchObject({
        fieldType: 'input',
        originalText: 'test',
        position: { left: 0, top: 0, width: 0, height: 0 }
      })
    })

    it('should calculate word count correctly', () => {
      const text = 'This is a test sentence with multiple words.'
      const wordCount = inputDetector._calculateWordCount(text)
      expect(wordCount).toBe(8)
    })

    it('should handle whitespace-only text', () => {
      const text = '   \n\n  \t   '
      const wordCount = inputDetector._calculateWordCount(text)
      expect(wordCount).toBe(0)
    })

    it('should detect field context from parent form', async () => {
      const mockForm = {
        tagName: 'FORM',
        id: 'contact-form',
        getAttribute: jest.fn().mockReturnValue('contact')
      }

      const mockElement = {
        tagName: 'INPUT',
        type: 'text',
        value: 'test@example.com',
        parentElement: mockForm,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 30 })
      }

      const fieldData = await inputDetector._extractFieldData(mockElement)

      expect(fieldData.fieldContext).toMatchObject({
        formId: 'contact-form',
        formType: 'contact'
      })
    })
  })

  describe('Error Handling', () => {
    it('should throw error for null element', async () => {
      await expect(inputDetector.detectField(null))
        .rejects.toThrow('Element is required')
    })

    it('should throw error for invalid element', async () => {
      const invalidElement = {}
      
      await expect(inputDetector.detectField(invalidElement))
        .rejects.toThrow('Element is not a valid input field')
    })

    it('should handle missing parent element gracefully', async () => {
      const mockElement = {
        tagName: 'INPUT',
        type: 'text',
        value: 'test',
        parentElement: null,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 30 })
      }

      const fieldData = await inputDetector._extractFieldData(mockElement)

      expect(fieldData.fieldContext).toEqual({})
    })
  })
})