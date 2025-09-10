// ABOUTME: Integration test for edge cases and error handling
// ABOUTME: Validates graceful handling of empty fields and error conditions

describe('Edge Cases Integration Test', () => {
  test('should handle empty text field activation gracefully', async () => {
    document.body.innerHTML = '<textarea id="empty-field"></textarea>'

    const emptyField = document.getElementById('empty-field')
    emptyField.focus()

    const ContentScript = require('../../src/content/content-script')
    await ContentScript.initialize()

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')

    analyzeButton.click()

    const feedbackMessage = clarityOverlay.querySelector('.feedback-message')
    expect(feedbackMessage.textContent).toContain('no text to analyze')
  })

  test('should handle AI service errors gracefully', async () => {
    document.body.innerHTML = '<textarea id="test-field">Test content</textarea>'

    const testField = document.getElementById('test-field')
    testField.focus()

    const ContentScript = require('../../src/content/content-script')
    await ContentScript.initialize()

    const mockAIService = require('../../src/lib/services/ai-service')
    mockAIService.analyzeText.mockRejectedValue(new Error('Service unavailable'))

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')

    analyzeButton.click()
    await new Promise(resolve => setTimeout(resolve, 100))

    const errorMessage = clarityOverlay.querySelector('.error-message')
    expect(errorMessage).toBeTruthy()
    expect(testField.value).toBe('Test content') // Unchanged
  })
})
