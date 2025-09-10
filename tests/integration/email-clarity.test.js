// ABOUTME: Integration test for email composition clarity improvement scenario
// ABOUTME: Tests end-to-end workflow from Gmail input field to AI-powered text improvement

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

describe('Email Composition Clarity Improvement Integration Test', () => {
  let mockEmailField
  let contentScript

  beforeEach(() => {
    // Set up Gmail-like email composition field
    mockEmailField = document.createElement('div')
    mockEmailField.contentEditable = 'true'
    mockEmailField.className = 'gmail-compose-area'
    mockEmailField.textContent = 'Hi, I was thinking that maybe we could possibly consider having a meeting sometime soon to discuss the project that we\'ve been working on lately.'
    document.body.appendChild(mockEmailField)

    // Initialize content script (will fail until implemented)
    try {
      contentScript = new ContentScript()
      contentScript.initialize()
    } catch (error) {
      // Expected to fail initially
    }
  })

  afterEach(() => {
    document.body.innerHTML = ''
    if (contentScript) {
      contentScript.cleanup()
    }
  })

  it('should complete full email composition clarity improvement workflow', async () => {
    // Step 1: User focuses on email composition area
    mockEmailField.focus()

    // Extension should detect the input field
    const fieldDetectedEvent = new Event('focusin', { bubbles: true })
    mockEmailField.dispatchEvent(fieldDetectedEvent)

    // Step 2: Extension should show IsItClear overlay
    await new Promise(resolve => setTimeout(resolve, 100)) // Wait for async detection

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    expect(clarityOverlay).toBeTruthy()
    expect(clarityOverlay.style.display).not.toBe('none')

    // Step 3: User clicks "Analyze for Clarity"
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')
    expect(analyzeButton).toBeTruthy()

    analyzeButton.click()

    // Step 4: Wait for AI analysis (should be <500ms)
    const analysisStartTime = Date.now()
    await new Promise(resolve => setTimeout(resolve, 600)) // Wait for analysis

    // Step 5: Verify analysis results are shown
    const resultsContainer = clarityOverlay.querySelector('.clarity-results')
    expect(resultsContainer).toBeTruthy()
    expect(resultsContainer.style.display).not.toBe('none')

    const improvedText = resultsContainer.querySelector('.improved-text')
    expect(improvedText).toBeTruthy()
    expect(improvedText.textContent).not.toBe(mockEmailField.textContent)
    expect(improvedText.textContent.length).toBeLessThan(mockEmailField.textContent.length)

    // Step 6: Verify performance requirement (<500ms)
    const processingTime = Date.now() - analysisStartTime
    expect(processingTime).toBeLessThan(500)

    // Step 7: User accepts the improvement
    const acceptButton = clarityOverlay.querySelector('.accept-button')
    expect(acceptButton).toBeTruthy()

    acceptButton.click()

    // Step 8: Verify text is replaced in the email field
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(mockEmailField.textContent).toBe(improvedText.textContent)

    // Step 9: Verify email functionality is preserved
    expect(mockEmailField.contentEditable).toBe('true')
    expect(mockEmailField.className).toBe('gmail-compose-area')
  })

  it('should handle empty email field gracefully', async () => {
    // Clear the email field
    mockEmailField.textContent = ''
    mockEmailField.focus()

    const fieldDetectedEvent = new Event('focusin', { bubbles: true })
    mockEmailField.dispatchEvent(fieldDetectedEvent)

    await new Promise(resolve => setTimeout(resolve, 100))

    // Extension should show appropriate feedback
    const clarityOverlay = document.querySelector('.isitclear-overlay')
    expect(clarityOverlay).toBeTruthy()

    const analyzeButton = clarityOverlay.querySelector('.analyze-button')
    analyzeButton.click()

    await new Promise(resolve => setTimeout(resolve, 100))

    // Should show "no text to analyze" message
    const errorMessage = clarityOverlay.querySelector('.error-message')
    expect(errorMessage).toBeTruthy()
    expect(errorMessage.textContent).toContain('no text to analyze')
  })

  it('should handle AI service unavailable', async () => {
    // Mock AI service unavailable
    chrome.ai.rewriter.capabilities.mockResolvedValue({ available: 'no' })
    chrome.ai.languageModel.capabilities.mockResolvedValue({ available: 'no' })

    mockEmailField.focus()
    const fieldDetectedEvent = new Event('focusin', { bubbles: true })
    mockEmailField.dispatchEvent(fieldDetectedEvent)

    await new Promise(resolve => setTimeout(resolve, 100))

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')

    analyzeButton.click()

    await new Promise(resolve => setTimeout(resolve, 100))

    // Should show AI unavailable message
    const errorMessage = clarityOverlay.querySelector('.error-message')
    expect(errorMessage).toBeTruthy()
    expect(errorMessage.textContent).toContain('AI service unavailable')
  })

  it('should preserve email formatting and functionality', async () => {
    // Add rich formatting to email
    mockEmailField.innerHTML = '<strong>Hi,</strong> I was thinking that <em>maybe</em> we could possibly consider having a meeting.'

    mockEmailField.focus()
    const fieldDetectedEvent = new Event('focusin', { bubbles: true })
    mockEmailField.dispatchEvent(fieldDetectedEvent)

    await new Promise(resolve => setTimeout(resolve, 100))

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')
    const acceptButton = clarityOverlay.querySelector('.accept-button')

    analyzeButton.click()
    await new Promise(resolve => setTimeout(resolve, 600))

    acceptButton.click()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify original HTML structure is preserved where possible
    expect(mockEmailField.innerHTML).toContain('<strong>')
    expect(mockEmailField.innerHTML).toContain('<em>')
  })

  it('should handle user rejection of suggestion', async () => {
    const originalText = mockEmailField.textContent

    mockEmailField.focus()
    const fieldDetectedEvent = new Event('focusin', { bubbles: true })
    mockEmailField.dispatchEvent(fieldDetectedEvent)

    await new Promise(resolve => setTimeout(resolve, 100))

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')
    const rejectButton = clarityOverlay.querySelector('.reject-button')

    analyzeButton.click()
    await new Promise(resolve => setTimeout(resolve, 600))

    rejectButton.click()
    await new Promise(resolve => setTimeout(resolve, 100))

    // Text should remain unchanged
    expect(mockEmailField.textContent).toBe(originalText)

    // Overlay should be hidden
    expect(clarityOverlay.style.display).toBe('none')
  })

  it('should meet performance requirements', async () => {
    mockEmailField.focus()
    const fieldDetectedEvent = new Event('focusin', { bubbles: true })
    mockEmailField.dispatchEvent(fieldDetectedEvent)

    await new Promise(resolve => setTimeout(resolve, 100))

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')

    const analysisStartTime = Date.now()
    analyzeButton.click()

    // Wait for analysis to complete
    await new Promise(resolve => {
      const checkForResults = () => {
        const results = clarityOverlay.querySelector('.clarity-results')
        if (results && results.style.display !== 'none') {
          const processingTime = Date.now() - analysisStartTime
          expect(processingTime).toBeLessThan(500)
          resolve()
        } else {
          setTimeout(checkForResults, 10)
        }
      }
      checkForResults()
    })
  })
})

// Placeholder classes that will be implemented
class ContentScript {
  constructor () {
    throw new Error('ContentScript not implemented')
  }

  initialize () {
    throw new Error('ContentScript.initialize not implemented')
  }

  cleanup () {
    throw new Error('ContentScript.cleanup not implemented')
  }
}
