// ABOUTME: Contract tests for extension internal API communication
// ABOUTME: Validates message passing and component integration contracts

describe('Extension Internal API Contract Tests', () => {
  describe('Input Field Detection', () => {
    test('should detect input field and create InputFieldData', async () => {
      // Contract: InputFieldData schema
      const mockInput = createMockInput('textarea', 'Sample text content')
      document.body.appendChild(mockInput)

      // This will fail initially - no implementation exists yet
      const InputDetector = require('../../src/lib/services/input-detector')
      const fieldData = await InputDetector.detectField(mockInput)

      expect(fieldData).toMatchObject({
        element: expect.any(String),
        fieldType: expect.stringMatching(/^(input|textarea|contenteditable)$/),
        text: expect.any(String),
        cursorPosition: expect.any(Number),
        selectionStart: expect.any(Number),
        selectionEnd: expect.any(Number)
      })

      expect(fieldData.text).toBe('Sample text content')
      expect(fieldData.fieldType).toBe('textarea')
    })

    test('should handle contenteditable elements', async () => {
      const mockDiv = createMockInput('contenteditable', 'Editable content')
      document.body.appendChild(mockDiv)

      const InputDetector = require('../../src/lib/services/input-detector')
      const fieldData = await InputDetector.detectField(mockDiv)

      expect(fieldData.fieldType).toBe('contenteditable')
      expect(fieldData.text).toBe('Editable content')
    })

    test('should reject non-input elements', async () => {
      const mockSpan = document.createElement('span')
      mockSpan.textContent = 'Not an input'
      document.body.appendChild(mockSpan)

      const InputDetector = require('../../src/lib/services/input-detector')

      await expect(InputDetector.detectField(mockSpan)).rejects.toThrow('Element is not a valid input field')
    })

    test('should handle empty input fields', async () => {
      const mockInput = createMockInput('input', '')
      document.body.appendChild(mockInput)

      const InputDetector = require('../../src/lib/services/input-detector')
      const fieldData = await InputDetector.detectField(mockInput)

      expect(fieldData.text).toBe('')
      expect(fieldData.fieldType).toBe('input')
    })
  })

  describe('Analysis Result Handling', () => {
    test('should create valid ClarityAnalysisResult', async () => {
      // Contract: ClarityAnalysisResult schema
      const originalText = 'This is some text that might need improvement for clarity.'
      const mockAnalysisData = {
        originalText,
        improvedText: 'This text needs clarity improvement.',
        changes: [
          {
            changeType: 'word-choice',
            originalPhrase: 'might need improvement',
            improvedPhrase: 'needs improvement',
            reason: 'Removed uncertainty for clearer meaning',
            startPosition: 25,
            endPosition: 45
          }
        ],
        confidenceScore: 0.8,
        processingTime: 250,
        improvementType: 'rewriter'
      }

      // This will fail initially - no implementation exists yet
      const TextAnalyzer = require('../../src/lib/services/text-analyzer')
      const result = await TextAnalyzer.createAnalysisResult(mockAnalysisData)

      expect(result).toMatchObject({
        originalText: expect.any(String),
        improvedText: expect.any(String),
        changes: expect.arrayContaining([
          expect.objectContaining({
            changeType: expect.stringMatching(/^(word-choice|sentence-structure|clarity|conciseness)$/),
            originalPhrase: expect.any(String),
            improvedPhrase: expect.any(String),
            reason: expect.any(String),
            startPosition: expect.any(Number),
            endPosition: expect.any(Number)
          })
        ]),
        confidenceScore: expect.any(Number),
        processingTime: expect.any(Number),
        improvementType: expect.stringMatching(/^(rewriter|prompt)$/)
      })

      expect(result.confidenceScore).toBeGreaterThanOrEqual(0)
      expect(result.confidenceScore).toBeLessThanOrEqual(1)
      expect(result.processingTime).toBeGreaterThan(0)
    })

    test('should validate change positions', async () => {
      const mockAnalysisData = {
        originalText: 'Short text',
        improvedText: 'Brief text',
        changes: [
          {
            changeType: 'word-choice',
            originalPhrase: 'Short',
            improvedPhrase: 'Brief',
            reason: 'More precise word choice',
            startPosition: 0,
            endPosition: 5
          }
        ]
      }

      const TextAnalyzer = require('../../src/lib/services/text-analyzer')
      const result = await TextAnalyzer.createAnalysisResult(mockAnalysisData)

      expect(result.changes[0].startPosition).toBeLessThan(result.changes[0].endPosition)
      expect(result.changes[0].endPosition).toBeLessThanOrEqual(mockAnalysisData.originalText.length)
    })

    test('should handle invalid change types', async () => {
      const mockAnalysisData = {
        originalText: 'Test text',
        improvedText: 'Test text',
        changes: [
          {
            changeType: 'invalid-change-type',
            originalPhrase: 'Test',
            improvedPhrase: 'Test',
            reason: 'No change',
            startPosition: 0,
            endPosition: 4
          }
        ]
      }

      const TextAnalyzer = require('../../src/lib/services/text-analyzer')

      await expect(TextAnalyzer.createAnalysisResult(mockAnalysisData)).rejects.toThrow('Invalid change type')
    })
  })

  describe('User Action Processing', () => {
    test('should process accept action', async () => {
      // Contract: UserAction schema for accept
      const userAction = {
        action: 'accept',
        data: {
          analysisResult: {
            improvedText: 'Improved text content',
            originalText: 'Original text content'
          },
          fieldElement: 'textarea#email-body'
        }
      }

      // This will fail initially - no implementation exists yet
      const ActionProcessor = require('../../src/lib/services/action-processor')
      const result = await ActionProcessor.processUserAction(userAction)

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        action: 'accept',
        appliedChanges: expect.any(Boolean)
      })

      if (result.success) {
        expect(result.appliedChanges).toBe(true)
      }
    })

    test('should process reject action', async () => {
      const userAction = {
        action: 'reject',
        data: {
          analysisResult: {
            improvedText: 'Improved text',
            originalText: 'Original text'
          },
          reason: 'Meaning changed'
        }
      }

      const ActionProcessor = require('../../src/lib/services/action-processor')
      const result = await ActionProcessor.processUserAction(userAction)

      expect(result).toMatchObject({
        success: true,
        action: 'reject',
        appliedChanges: false
      })
    })

    test('should process analyze action', async () => {
      const userAction = {
        action: 'analyze',
        data: {
          inputField: {
            element: 'textarea',
            fieldType: 'textarea',
            text: 'Text to analyze'
          }
        }
      }

      const ActionProcessor = require('../../src/lib/services/action-processor')
      const result = await ActionProcessor.processUserAction(userAction)

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        action: 'analyze'
      })

      if (result.success) {
        expect(result.analysisStarted).toBe(true)
      }
    })

    test('should validate required action parameter', async () => {
      const userAction = {
        // Missing action parameter
        data: {}
      }

      const ActionProcessor = require('../../src/lib/services/action-processor')

      await expect(ActionProcessor.processUserAction(userAction)).rejects.toThrow('Missing required parameter: action')
    })

    test('should handle invalid action types', async () => {
      const userAction = {
        action: 'invalid-action',
        data: {}
      }

      const ActionProcessor = require('../../src/lib/services/action-processor')

      await expect(ActionProcessor.processUserAction(userAction)).rejects.toThrow('Invalid action type')
    })

    test('should process undo action', async () => {
      const userAction = {
        action: 'undo',
        data: {
          previousState: {
            originalText: 'Original text',
            fieldElement: 'textarea'
          }
        }
      }

      const ActionProcessor = require('../../src/lib/services/action-processor')
      const result = await ActionProcessor.processUserAction(userAction)

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        action: 'undo',
        appliedChanges: expect.any(Boolean)
      })
    })

    test('should process settings action', async () => {
      const userAction = {
        action: 'settings',
        data: {
          preferences: {
            tone: 'formal',
            autoActivate: true,
            keyboardShortcut: 'Ctrl+Shift+C'
          }
        }
      }

      const ActionProcessor = require('../../src/lib/services/action-processor')
      const result = await ActionProcessor.processUserAction(userAction)

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        action: 'settings',
        preferencesUpdated: expect.any(Boolean)
      })
    })
  })

  describe('Extension Message Passing', () => {
    test('should create valid ExtensionMessage', async () => {
      // Contract: ExtensionMessage schema
      const messageData = {
        type: 'ANALYZE_TEXT',
        payload: {
          inputField: {
            text: 'Text to analyze'
          }
        },
        source: 'content-script',
        target: 'background'
      }

      const MessageHandler = require('../../src/lib/services/message-handler')
      const message = await MessageHandler.createMessage(messageData)

      expect(message).toMatchObject({
        type: expect.stringMatching(/^(INPUT_DETECTED|ANALYZE_TEXT|ANALYSIS_RESULT|USER_ACTION|UI_UPDATE|ERROR|PREFERENCES_CHANGED)$/),
        payload: expect.any(Object),
        timestamp: expect.any(String),
        source: expect.stringMatching(/^(content-script|background|popup|options)$/),
        target: expect.stringMatching(/^(content-script|background|popup|options)$/)
      })

      // Validate timestamp format (ISO 8601)
      expect(new Date(message.timestamp)).toBeInstanceOf(Date)
      expect(isNaN(new Date(message.timestamp).getTime())).toBe(false)
    })

    test('should handle message routing', async () => {
      const message = {
        type: 'INPUT_DETECTED',
        payload: { field: 'textarea' },
        source: 'content-script',
        target: 'background'
      }

      const MessageHandler = require('../../src/lib/services/message-handler')
      const result = await MessageHandler.routeMessage(message)

      expect(result).toMatchObject({
        delivered: expect.any(Boolean),
        target: 'background'
      })
    })

    test('should validate message types', async () => {
      const messageData = {
        type: 'INVALID_MESSAGE_TYPE',
        payload: {},
        source: 'content-script',
        target: 'background'
      }

      const MessageHandler = require('../../src/lib/services/message-handler')

      await expect(MessageHandler.createMessage(messageData)).rejects.toThrow('Invalid message type')
    })
  })
})
