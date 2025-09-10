// ABOUTME: Integration test for form field text improvement scenario
// ABOUTME: Validates extension works in web forms without disrupting submission

describe('Form Field Text Improvement Integration Test', () => {
  test('should improve form field text without disrupting submission', async () => {
    document.body.innerHTML = `
      <form id="contact-form" method="post" action="/submit">
        <textarea id="feedback" name="feedback" required></textarea>
        <button type="submit">Submit</button>
      </form>
    `

    const feedbackArea = document.getElementById('feedback')
    const unclearText = 'The thing didn\'t work right and I\'m not sure why but it seems like there might be some kind of problem with the way it\'s set up or something.'

    feedbackArea.value = unclearText
    feedbackArea.focus()

    const ContentScript = require('../../src/content/content-script')
    await ContentScript.initialize()

    const mockAIService = require('../../src/lib/services/ai-service')
    mockAIService.analyzeText.mockResolvedValue({
      success: true,
      improvedText: 'The system isn\'t functioning properly due to a configuration issue.',
      confidenceScore: 0.92,
      processingTime: 280,
      apiUsed: 'rewriter'
    })

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')
    const acceptButton = clarityOverlay.querySelector('.accept-button')

    analyzeButton.click()
    await new Promise(resolve => setTimeout(resolve, 300))
    acceptButton.click()

    // Verify improvement
    expect(feedbackArea.value).toBe('The system isn\'t functioning properly due to a configuration issue.')

    // Verify form can still be submitted
    const form = document.getElementById('contact-form')
    expect(form.checkValidity()).toBe(true)

    const submitButton = form.querySelector('button[type="submit"]')
    expect(submitButton.disabled).toBeFalsy()
  })
})
