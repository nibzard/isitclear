// ABOUTME: Contract tests for IsItClear extension internal APIs
// ABOUTME: Validates extension component communication schemas match contracts

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { validateInputFieldData } from '../../src/lib/models/TextContent.js'
import { validateClarityAnalysisResult, validateTextChange } from '../../src/lib/models/ClarityImprovement.js'
import { validateUserAction } from '../../src/lib/models/UserAction.js'
import { validateUIState } from '../../src/lib/models/UIState.js'
import { validateExtensionMessage, handleExtensionMessage } from '../../src/lib/models/ExtensionMessage.js'

describe('Extension Internal API Contract Tests', () => {
  let mockInputElement

  beforeEach(() => {
    mockInputElement = createMockInputElement('input', 'Sample text content')
    document.body.appendChild(mockInputElement)
  })

  describe('InputFieldData Schema Validation', () => {
    it('should validate complete input field data', () => {
      const validInputData = {
        element: 'input[type="text"]',
        fieldType: 'input',
        text: 'Sample text content',
        cursorPosition: 5,
        selectionStart: 0,
        selectionEnd: 5
      }

      // This test will fail until we implement the input detector
      expect(() => validateInputFieldData(validInputData)).not.toThrow()
    })

    it('should reject input data with missing required fields', () => {
      const invalidInputData = {
        fieldType: 'input'
        // missing element and text
      }

      // This test will fail until we implement validation
      expect(() => validateInputFieldData(invalidInputData)).toThrow('Element is required')
    })

    it('should reject input data with invalid field type', () => {
      const invalidInputData = {
        element: 'div',
        fieldType: 'invalid-type',
        text: 'Sample text'
      }

      // This test will fail until we implement validation
      expect(() => validateInputFieldData(invalidInputData)).toThrow('Invalid field type')
    })
  })

  describe('ClarityAnalysisResult Schema Validation', () => {
    it('should validate complete analysis result', () => {
      const validResult = {
        originalText: 'This text could be better.',
        improvedText: 'This text could improve.',
        changes: [
          {
            changeType: 'word-choice',
            originalPhrase: 'could be better',
            improvedPhrase: 'could improve',
            reason: 'More concise phrasing',
            startPosition: 10,
            endPosition: 25
          }
        ],
        confidenceScore: 0.85,
        processingTime: 250,
        improvementType: 'rewriter'
      }

      // This test will fail until we implement result validation
      expect(() => validateClarityAnalysisResult(validResult)).not.toThrow()
    })

    it('should reject result with missing required fields', () => {
      const invalidResult = {
        originalText: 'Sample text'
        // missing improvedText and changes
      }

      // This test will fail until we implement validation
      expect(() => validateClarityAnalysisResult(invalidResult)).toThrow('Improved text is required')
    })

    it('should validate confidence score range', () => {
      const invalidResult = {
        originalText: 'Sample text',
        improvedText: 'Improved text',
        changes: [],
        confidenceScore: 1.5 // Invalid: > 1
      }

      // This test will fail until we implement validation
      expect(() => validateClarityAnalysisResult(invalidResult)).toThrow('Confidence score must be between 0 and 1')
    })
  })

  describe('TextChange Schema Validation', () => {
    it('should validate text change structure', () => {
      const validChange = {
        changeType: 'clarity',
        originalPhrase: 'kind of confusing',
        improvedPhrase: 'confusing',
        reason: 'Removed unnecessary qualifier',
        startPosition: 5,
        endPosition: 21
      }

      // This test will fail until we implement change validation
      expect(() => validateTextChange(validChange)).not.toThrow()
    })

    it('should reject change with invalid type', () => {
      const invalidChange = {
        changeType: 'invalid-type',
        originalPhrase: 'some text',
        improvedPhrase: 'better text',
        reason: 'Improvement'
      }

      // This test will fail until we implement validation
      expect(() => validateTextChange(invalidChange)).toThrow('Invalid change type')
    })

    it('should reject change with invalid position range', () => {
      const invalidChange = {
        changeType: 'clarity',
        originalPhrase: 'some text',
        improvedPhrase: 'better text',
        reason: 'Improvement',
        startPosition: 10,
        endPosition: 5 // Invalid: end < start
      }

      // This test will fail until we implement validation
      expect(() => validateTextChange(invalidChange)).toThrow('End position must be greater than start position')
    })
  })

  describe('UserAction Schema Validation', () => {
    it('should validate accept action', () => {
      const validAction = {
        action: 'accept',
        data: {
          analysisId: 'analysis-123',
          fieldSelector: 'input[type="text"]'
        }
      }

      // This test will fail until we implement action validation
      expect(() => validateUserAction(validAction)).not.toThrow()
    })

    it('should validate reject action', () => {
      const validAction = {
        action: 'reject',
        data: {
          analysisId: 'analysis-123',
          reason: 'user-preference'
        }
      }

      // This test will fail until we implement action validation
      expect(() => validateUserAction(validAction)).not.toThrow()
    })

    it('should reject invalid action type', () => {
      const invalidAction = {
        action: 'invalid-action'
      }

      // This test will fail until we implement validation
      expect(() => validateUserAction(invalidAction)).toThrow('Invalid action type')
    })
  })

  describe('UIState Schema Validation', () => {
    it('should validate UI state structure', () => {
      const validState = {
        visible: true,
        position: {
          x: 100,
          y: 200
        },
        mode: 'showing-results',
        progress: 75
      }

      // This test will fail until we implement UI state validation
      expect(() => validateUIState(validState)).not.toThrow()
    })

    it('should reject state with invalid mode', () => {
      const invalidState = {
        visible: true,
        position: { x: 100, y: 200 },
        mode: 'invalid-mode'
      }

      // This test will fail until we implement validation
      expect(() => validateUIState(invalidState)).toThrow('Invalid UI mode')
    })

    it('should validate progress range', () => {
      const invalidState = {
        visible: true,
        position: { x: 100, y: 200 },
        mode: 'analyzing',
        progress: 150 // Invalid: > 100
      }

      // This test will fail until we implement validation
      expect(() => validateUIState(invalidState)).toThrow('Progress must be between 0 and 100')
    })
  })

  describe('ExtensionMessage Schema Validation', () => {
    it('should validate message structure', () => {
      const validMessage = {
        type: 'ANALYZE_TEXT',
        payload: {
          inputField: {
            element: 'textarea',
            fieldType: 'textarea',
            text: 'Text to analyze'
          }
        },
        timestamp: new Date().toISOString(),
        source: 'content-script',
        target: 'background'
      }

      // This test will fail until we implement message validation
      expect(() => validateExtensionMessage(validMessage)).not.toThrow()
    })

    it('should reject message with invalid type', () => {
      const invalidMessage = {
        type: 'INVALID_TYPE',
        payload: {},
        source: 'content-script',
        target: 'background'
      }

      // This test will fail until we implement validation
      expect(() => validateExtensionMessage(invalidMessage)).toThrow('Invalid message type')
    })

    it('should reject message with invalid source/target', () => {
      const invalidMessage = {
        type: 'ANALYZE_TEXT',
        payload: {},
        source: 'invalid-source',
        target: 'background'
      }

      // This test will fail until we implement validation
      expect(() => validateExtensionMessage(invalidMessage)).toThrow('Invalid message source')
    })
  })

  describe('Extension Communication Flow', () => {
    it('should handle input detection message', async () => {
      const inputDetectedMessage = {
        type: 'INPUT_DETECTED',
        payload: {
          element: 'input[type="text"]',
          fieldType: 'input',
          text: 'Sample text'
        },
        source: 'content-script',
        target: 'background'
      }

      // This test will fail until we implement message handling
      const result = await handleExtensionMessage(inputDetectedMessage)
      expect(result.success).toBe(true)
    })

    it('should handle analysis request message', async () => {
      const analyzeMessage = {
        type: 'ANALYZE_TEXT',
        payload: {
          inputField: {
            element: 'textarea',
            fieldType: 'textarea',
            text: 'Text that needs improvement'
          },
          userPreferences: {
            tone: 'neutral',
            showDetails: true
          }
        },
        source: 'content-script',
        target: 'background'
      }

      // This test will fail until we implement message handling
      const result = await handleExtensionMessage(analyzeMessage)
      expect(result.type).toBe('ANALYSIS_RESULT')
      expect(result.payload.improvedText).toBeDefined()
    })

    it('should handle user action message', async () => {
      const userActionMessage = {
        type: 'USER_ACTION',
        payload: {
          action: 'accept',
          data: {
            analysisId: 'analysis-123'
          }
        },
        source: 'content-script',
        target: 'background'
      }

      // This test will fail until we implement action handling
      const result = await handleExtensionMessage(userActionMessage)
      expect(result.success).toBe(true)
    })
  })
})
