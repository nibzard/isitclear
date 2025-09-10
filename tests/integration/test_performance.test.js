// ABOUTME: Integration test for performance requirements
// ABOUTME: Validates processing times and resource usage meet specifications

describe('Performance Integration Test', () => {
  test('should handle long text processing within time limits', async () => {
    const longText = 'This is a very long paragraph that contains many words and sentences that could potentially be improved for clarity and readability. '.repeat(20)

    document.body.innerHTML = `<textarea id="long-text">${longText}</textarea>`

    const textArea = document.getElementById('long-text')
    textArea.focus()

    const ContentScript = require('../../src/content/content-script')
    await ContentScript.initialize()

    const mockAIService = require('../../src/lib/services/ai-service')
    mockAIService.analyzeText.mockResolvedValue({
      success: true,
      improvedText: 'This improved paragraph contains clear, readable sentences. '.repeat(15),
      confidenceScore: 0.85,
      processingTime: 1800, // Under 2 second limit for long text
      apiUsed: 'rewriter'
    })

    const startTime = Date.now()

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')

    analyzeButton.click()
    await new Promise(resolve => setTimeout(resolve, 2000))

    const endTime = Date.now()
    const totalTime = endTime - startTime

    expect(totalTime).toBeLessThan(2000) // Performance requirement

    const acceptButton = clarityOverlay.querySelector('.accept-button')
    expect(acceptButton).toBeTruthy() // Should complete successfully
  })

  test('should maintain browser responsiveness during processing', async () => {
    document.body.innerHTML = '<textarea id="response-test">Medium length text to test browser responsiveness during AI processing.</textarea>'

    const textArea = document.getElementById('response-test')
    textArea.focus()

    const ContentScript = require('../../src/content/content-script')
    await ContentScript.initialize()

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')

    // Should remain interactive during processing
    analyzeButton.click()

    // UI should respond immediately
    expect(analyzeButton.disabled).toBe(true) // Shows processing state

    const loadingIndicator = clarityOverlay.querySelector('.loading-indicator')
    expect(loadingIndicator).toBeTruthy()
    expect(loadingIndicator.style.display).not.toBe('none')
  })
})
