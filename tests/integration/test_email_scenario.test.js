// ABOUTME: Integration test for email composition clarity improvement scenario
// ABOUTME: Validates complete user workflow from quickstart guide

describe('Email Composition Clarity Improvement Integration Test', () => {
  let mockEmailTextarea
  let extensionContentScript
  let mockAIService

  beforeEach(() => {
    // Setup DOM for email composition
    document.body.innerHTML = `
      <div id="gmail-compose">
        <textarea id="email-body" placeholder="Compose email..."></textarea>
        <button id="send-button">Send</button>
      </div>
    `

    mockEmailTextarea = document.getElementById('email-body')

    // Mock AI service responses
    mockAIService = {
      analyzeText: jest.fn(),
      createSession: jest.fn()
    }
  })

  afterEach(() => {
    document.body.innerHTML = ''
    jest.clearAllMocks()
  })

  test('should complete full email composition clarity improvement workflow', async () => {
    // Step 1: User types unclear text in email body
    const unclearText = 'Hi, I was thinking that maybe we could possibly consider having a meeting sometime soon to discuss the project that we\'ve been working on lately.'
    mockEmailTextarea.value = unclearText
    mockEmailTextarea.dispatchEvent(new Event('input'))

    // Step 2: Extension detects text field
    // This will fail initially - no implementation exists yet
    const contentScript = require('../../src/content/content-script')
    await contentScript.initialize()

    // Simulate focus on email textarea
    mockEmailTextarea.focus()
    mockEmailTextarea.dispatchEvent(new Event('focusin'))

    // Step 3: Extension should show IsItClear overlay
    await new Promise(resolve => setTimeout(resolve, 100)) // Wait for UI to appear

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    expect(clarityOverlay).toBeTruthy()
    expect(clarityOverlay.style.display).not.toBe('none')

    // Step 4: User clicks "Analyze for Clarity"
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')
    expect(analyzeButton).toBeTruthy()

    // Mock AI service to return improved text
    mockAIService.analyzeText.mockResolvedValue({
      success: true,
      improvedText: 'Hi, Let\'s schedule a meeting this week to discuss our current project.',
      confidenceScore: 0.9,
      processingTime: 300,
      apiUsed: 'rewriter',
      changes: [
        {
          changeType: 'conciseness',
          originalPhrase: 'I was thinking that maybe we could possibly consider having',
          improvedPhrase: 'Let\'s',
          reason: 'Removed unnecessary hedging for directness',
          startPosition: 4,
          endPosition: 58
        }
      ]
    })

    analyzeButton.click()

    // Step 5: Wait for AI processing
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate <500ms processing

    // Step 6: Review suggested improvement
    const improvementDisplay = clarityOverlay.querySelector('.improvement-display')
    expect(improvementDisplay).toBeTruthy()
    expect(improvementDisplay.textContent).toContain('Let\'s schedule a meeting this week')

    // Step 7: User clicks "Accept"
    const acceptButton = clarityOverlay.querySelector('.accept-button')
    expect(acceptButton).toBeTruthy()

    acceptButton.click()

    // Step 8: Verify text is replaced and email remains functional
    expect(mockEmailTextarea.value).toBe('Hi, Let\'s schedule a meeting this week to discuss our current project.')

    // Step 9: Verify email can still be sent (form functionality preserved)
    const sendButton = document.getElementById('send-button')
    expect(sendButton.disabled).toBeFalsy()

    // Step 10: Verify original meaning preserved
    expect(mockEmailTextarea.value).toContain('meeting')
    expect(mockEmailTextarea.value).toContain('project')
    expect(mockEmailTextarea.value.length).toBeLessThan(unclearText.length) // More concise
  })

  test('should handle empty email field gracefully', async () => {
    // User focuses on empty email field
    mockEmailTextarea.value = ''
    mockEmailTextarea.focus()
    mockEmailTextarea.dispatchEvent(new Event('focusin'))

    const contentScript = require('../../src/content/content-script')
    await contentScript.initialize()

    // Extension should show appropriate feedback
    const clarityOverlay = document.querySelector('.isitclear-overlay')
    expect(clarityOverlay).toBeTruthy()

    const analyzeButton = clarityOverlay.querySelector('.analyze-button')
    analyzeButton.click()

    // Should show "no text to analyze" message
    const feedbackMessage = clarityOverlay.querySelector('.feedback-message')
    expect(feedbackMessage.textContent).toContain('no text to analyze')
  })

  test('should handle AI service unavailable', async () => {
    const unclearText = 'Test email content that needs improvement.'
    mockEmailTextarea.value = unclearText
    mockEmailTextarea.focus()

    // Mock AI service as unavailable
    mockAIService.analyzeText.mockRejectedValue(new Error('AI service unavailable'))

    const contentScript = require('../../src/content/content-script')
    await contentScript.initialize()

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')

    analyzeButton.click()

    await new Promise(resolve => setTimeout(resolve, 100))

    // Should show error message
    const errorMessage = clarityOverlay.querySelector('.error-message')
    expect(errorMessage).toBeTruthy()
    expect(errorMessage.textContent).toContain('AI service unavailable')

    // Original text should remain unchanged
    expect(mockEmailTextarea.value).toBe(unclearText)
  })

  test('should preserve email formatting and functionality', async () => {
    // Setup rich email with formatting
    document.body.innerHTML = `
      <div id="gmail-compose">
        <div id="email-body" contenteditable="true">
          <p><strong>Hi there,</strong></p>
          <p>I was thinking that maybe we could possibly consider having a meeting.</p>
          <p><em>Best regards</em></p>
        </div>
        <button id="send-button">Send</button>
      </div>
    `

    const richEmailDiv = document.getElementById('email-body')
    richEmailDiv.focus()

    const contentScript = require('../../src/content/content-script')
    await contentScript.initialize()

    // Simulate improvement process
    mockAIService.analyzeText.mockResolvedValue({
      success: true,
      improvedText: 'Let\'s schedule a meeting.',
      confidenceScore: 0.85,
      processingTime: 250,
      apiUsed: 'rewriter'
    })

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')
    const acceptButton = clarityOverlay.querySelector('.accept-button')

    analyzeButton.click()
    await new Promise(resolve => setTimeout(resolve, 300))
    acceptButton.click()

    // Should preserve HTML structure
    expect(richEmailDiv.querySelector('strong')).toBeTruthy()
    expect(richEmailDiv.querySelector('em')).toBeTruthy()

    // Should only improve the middle paragraph
    const paragraphs = richEmailDiv.querySelectorAll('p')
    expect(paragraphs[0].innerHTML).toBe('<strong>Hi there,</strong>')
    expect(paragraphs[1].textContent).toBe('Let\'s schedule a meeting.')
    expect(paragraphs[2].innerHTML).toBe('<em>Best regards</em>')
  })

  test('should handle user rejection of suggestion', async () => {
    const originalText = 'Hi, I was thinking we should meet.'
    mockEmailTextarea.value = originalText
    mockEmailTextarea.focus()

    const contentScript = require('../../src/content/content-script')
    await contentScript.initialize()

    mockAIService.analyzeText.mockResolvedValue({
      success: true,
      improvedText: 'Hi, Let\'s meet.',
      confidenceScore: 0.7,
      processingTime: 200,
      apiUsed: 'rewriter'
    })

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')
    const rejectButton = clarityOverlay.querySelector('.reject-button')

    analyzeButton.click()
    await new Promise(resolve => setTimeout(resolve, 250))
    rejectButton.click()

    // Original text should be preserved
    expect(mockEmailTextarea.value).toBe(originalText)

    // Overlay should hide
    expect(clarityOverlay.style.display).toBe('none')
  })

  test('should meet performance requirements', async () => {
    const testText = 'This is a moderately long email that needs some clarity improvements.'
    mockEmailTextarea.value = testText
    mockEmailTextarea.focus()

    const startTime = Date.now()

    const contentScript = require('../../src/content/content-script')
    await contentScript.initialize()

    // UI should appear immediately (<100ms)
    const uiAppearTime = Date.now()
    expect(uiAppearTime - startTime).toBeLessThan(100)

    mockAIService.analyzeText.mockResolvedValue({
      success: true,
      improvedText: 'This email needs clarity improvements.',
      confidenceScore: 0.8,
      processingTime: 450, // Under 500ms requirement
      apiUsed: 'rewriter'
    })

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')

    const analysisStartTime = Date.now()
    analyzeButton.click()

    await new Promise(resolve => setTimeout(resolve, 500))

    const analysisEndTime = Date.now()
    const totalProcessingTime = analysisEndTime - analysisStartTime

    // Should meet <500ms processing time goal
    expect(totalProcessingTime).toBeLessThan(500)

    const acceptButton = clarityOverlay.querySelector('.accept-button')
    expect(acceptButton).toBeTruthy() // Results should be available
  })
})
