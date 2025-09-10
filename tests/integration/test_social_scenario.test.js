// ABOUTME: Integration test for social media post enhancement scenario
// ABOUTME: Validates text clarity improvement in social media contexts

describe('Social Media Post Enhancement Integration Test', () => {
  let mockTwitterTextarea
  let mockFacebookTextarea
  let mockLinkedInTextarea

  beforeEach(() => {
    // Setup DOM for different social media platforms
    document.body.innerHTML = `
      <div id="twitter-compose">
        <textarea id="tweet-text" placeholder="What's happening?" maxlength="280"></textarea>
        <span id="char-count">280</span>
      </div>
      
      <div id="facebook-compose">
        <textarea id="fb-post" placeholder="What's on your mind?"></textarea>
        <button id="fb-post-button">Post</button>
      </div>
      
      <div id="linkedin-compose">
        <div id="linkedin-text" contenteditable="true" placeholder="Share an update..."></div>
        <button id="linkedin-publish">Publish</button>
      </div>
    `

    mockTwitterTextarea = document.getElementById('tweet-text')
    mockFacebookTextarea = document.getElementById('fb-post')
    mockLinkedInTextarea = document.getElementById('linkedin-text')
  })

  afterEach(() => {
    document.body.innerHTML = ''
    jest.clearAllMocks()
  })

  test('should improve Twitter post while respecting character limit', async () => {
    // User types unclear tweet
    const unclearTweet = 'So I was at this place today and there were these people doing this thing that was kind of interesting I guess and I thought I should share it with everyone because it was pretty cool.'
    mockTwitterTextarea.value = unclearTweet
    mockTwitterTextarea.focus()

    const ContentScript = require('../../src/content/content-script')
    await ContentScript.initialize()

    // Mock AI service to return improved, shorter text
    const mockAIService = require('../../src/lib/services/ai-service')
    mockAIService.analyzeText.mockResolvedValue({
      success: true,
      improvedText: 'Witnessed something fascinating today - thought you\'d find it interesting too!',
      confidenceScore: 0.9,
      processingTime: 350,
      apiUsed: 'rewriter',
      changes: [
        {
          changeType: 'conciseness',
          originalPhrase: 'So I was at this place today and there were these people doing this thing',
          improvedPhrase: 'Witnessed something fascinating today',
          reason: 'Removed vague language for specific, engaging content',
          startPosition: 0,
          endPosition: 74
        }
      ]
    })

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')
    const acceptButton = clarityOverlay.querySelector('.accept-button')

    analyzeButton.click()
    await new Promise(resolve => setTimeout(resolve, 400))
    acceptButton.click()

    // Verify improvement
    const improvedTweet = mockTwitterTextarea.value
    expect(improvedTweet).toBe('Witnessed something fascinating today - thought you\'d find it interesting too!')

    // Verify character count compliance
    expect(improvedTweet.length).toBeLessThanOrEqual(280)
    expect(improvedTweet.length).toBeLessThan(unclearTweet.length)

    // Verify character counter updated
    const charCount = document.getElementById('char-count')
    expect(parseInt(charCount.textContent)).toBe(280 - improvedTweet.length)
  })

  test('should improve Facebook post for better engagement', async () => {
    const unclearPost = 'I think maybe you guys might want to check out this thing I found. It\'s probably something that could be useful or whatever.'
    mockFacebookTextarea.value = unclearPost
    mockFacebookTextarea.focus()

    const ContentScript = require('../../src/content/content-script')
    await ContentScript.initialize()

    const mockAIService = require('../../src/lib/services/ai-service')
    mockAIService.analyzeText.mockResolvedValue({
      success: true,
      improvedText: 'Found an amazing resource that could help you! Check it out and let me know what you think.',
      confidenceScore: 0.85,
      processingTime: 420,
      apiUsed: 'rewriter'
    })

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')
    const acceptButton = clarityOverlay.querySelector('.accept-button')

    analyzeButton.click()
    await new Promise(resolve => setTimeout(resolve, 450))
    acceptButton.click()

    const improvedPost = mockFacebookTextarea.value
    expect(improvedPost).toBe('Found an amazing resource that could help you! Check it out and let me know what you think.')

    // Should be more engaging (removes hedging language)
    expect(improvedPost).not.toContain('I think maybe')
    expect(improvedPost).not.toContain('probably')
    expect(improvedPost).not.toContain('or whatever')

    // Should encourage interaction
    expect(improvedPost).toContain('let me know what you think')

    // Post functionality should remain intact
    const postButton = document.getElementById('fb-post-button')
    expect(postButton.disabled).toBeFalsy()
  })

  test('should improve LinkedIn post for professional tone', async () => {
    const casualPost = 'Hey everyone! So like, I just finished this project and it was pretty crazy how much I learned.'
    mockLinkedInTextarea.textContent = casualPost
    mockLinkedInTextarea.focus()

    const ContentScript = require('../../src/content/content-script')
    await ContentScript.initialize()

    const mockAIService = require('../../src/lib/services/ai-service')
    mockAIService.analyzeText.mockResolvedValue({
      success: true,
      improvedText: 'Just completed a challenging project that provided significant learning opportunities.',
      confidenceScore: 0.88,
      processingTime: 380,
      apiUsed: 'rewriter',
      changes: [
        {
          changeType: 'word-choice',
          originalPhrase: 'Hey everyone! So like,',
          improvedPhrase: '',
          reason: 'Removed casual greeting for professional tone',
          startPosition: 0,
          endPosition: 22
        },
        {
          changeType: 'word-choice',
          originalPhrase: 'pretty crazy',
          improvedPhrase: 'significant',
          reason: 'Used professional terminology',
          startPosition: 65,
          endPosition: 77
        }
      ]
    })

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')
    const acceptButton = clarityOverlay.querySelector('.accept-button')

    analyzeButton.click()
    await new Promise(resolve => setTimeout(resolve, 400))
    acceptButton.click()

    const improvedPost = mockLinkedInTextarea.textContent
    expect(improvedPost).toBe('Just completed a challenging project that provided significant learning opportunities.')

    // Should be more professional
    expect(improvedPost).not.toContain('Hey everyone!')
    expect(improvedPost).not.toContain('So like')
    expect(improvedPost).not.toContain('pretty crazy')

    // Should maintain professional tone
    expect(improvedPost).toContain('challenging project')
    expect(improvedPost).toContain('learning opportunities')
  })

  test('should handle hashtags and mentions preservation', async () => {
    const postWithTags = 'This #project was kind of maybe interesting and I think @johndoe might like it probably.'
    mockTwitterTextarea.value = postWithTags
    mockTwitterTextarea.focus()

    const ContentScript = require('../../src/content/content-script')
    await ContentScript.initialize()

    const mockAIService = require('../../src/lib/services/ai-service')
    mockAIService.analyzeText.mockResolvedValue({
      success: true,
      improvedText: 'This #project was fascinating and @johndoe would love it!',
      confidenceScore: 0.82,
      processingTime: 290,
      apiUsed: 'rewriter'
    })

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')
    const acceptButton = clarityOverlay.querySelector('.accept-button')

    analyzeButton.click()
    await new Promise(resolve => setTimeout(resolve, 320))
    acceptButton.click()

    const improvedPost = mockTwitterTextarea.value

    // Should preserve hashtags and mentions
    expect(improvedPost).toContain('#project')
    expect(improvedPost).toContain('@johndoe')

    // Should improve clarity
    expect(improvedPost).not.toContain('kind of maybe')
    expect(improvedPost).not.toContain('I think')
    expect(improvedPost).not.toContain('probably')

    expect(improvedPost).toBe('This #project was fascinating and @johndoe would love it!')
  })

  test('should optimize for platform-specific character limits', async () => {
    // Test with text that exceeds Twitter limit but fits other platforms
    const longPost = 'I wanted to share this really long story about something that happened to me yesterday when I was walking down the street and I saw this person doing something that reminded me of a similar experience I had last year around the same time of year and it got me thinking about how interesting life can be when you really pay attention to all the small details that happen around you every single day.'

    mockTwitterTextarea.value = longPost
    mockTwitterTextarea.focus()

    const ContentScript = require('../../src/content/content-script')
    await ContentScript.initialize()

    const mockAIService = require('../../src/lib/services/ai-service')

    // AI service should automatically optimize for platform
    mockAIService.analyzeText.mockImplementation((request) => {
      const isTwitter = request.context && request.context.platform === 'twitter'

      if (isTwitter) {
        return Promise.resolve({
          success: true,
          improvedText: 'Yesterday\'s street encounter sparked thoughts about life\'s fascinating details we often overlook. #mindfulness',
          confidenceScore: 0.9,
          processingTime: 400,
          apiUsed: 'rewriter'
        })
      }

      return Promise.resolve({
        success: true,
        improvedText: 'Yesterday I had a street encounter that reminded me of a similar experience last year. It made me think about how fascinating life becomes when you pay attention to small daily details.',
        confidenceScore: 0.85,
        processingTime: 380,
        apiUsed: 'rewriter'
      })
    })

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')
    const acceptButton = clarityOverlay.querySelector('.accept-button')

    analyzeButton.click()
    await new Promise(resolve => setTimeout(resolve, 420))
    acceptButton.click()

    const improvedPost = mockTwitterTextarea.value

    // Should fit Twitter's character limit
    expect(improvedPost.length).toBeLessThanOrEqual(280)

    // Should maintain core message
    expect(improvedPost).toContain('encounter')
    expect(improvedPost).toContain('details')

    // Should be optimized for Twitter (includes hashtag)
    expect(improvedPost).toContain('#mindfulness')
  })

  test('should handle emoji preservation and context', async () => {
    const postWithEmojis = 'So like, this thing happened today 😅 and I was thinking maybe you guys would find it funny 🤔💭 or whatever lol 😂'
    mockFacebookTextarea.value = postWithEmojis
    mockFacebookTextarea.focus()

    const ContentScript = require('../../src/content/content-script')
    await ContentScript.initialize()

    const mockAIService = require('../../src/lib/services/ai-service')
    mockAIService.analyzeText.mockResolvedValue({
      success: true,
      improvedText: 'Something amusing happened today 😅 and I thought you\'d find it funny too! 😂',
      confidenceScore: 0.8,
      processingTime: 310,
      apiUsed: 'rewriter'
    })

    const clarityOverlay = document.querySelector('.isitclear-overlay')
    const analyzeButton = clarityOverlay.querySelector('.analyze-button')
    const acceptButton = clarityOverlay.querySelector('.accept-button')

    analyzeButton.click()
    await new Promise(resolve => setTimeout(resolve, 340))
    acceptButton.click()

    const improvedPost = mockFacebookTextarea.value

    // Should preserve relevant emojis
    expect(improvedPost).toContain('😅')
    expect(improvedPost).toContain('😂')

    // Should improve clarity while maintaining tone
    expect(improvedPost).not.toContain('So like')
    expect(improvedPost).not.toContain('or whatever lol')
    expect(improvedPost).not.toContain('maybe you guys')

    expect(improvedPost).toBe('Something amusing happened today 😅 and I thought you\'d find it funny too! 😂')
  })

  test('should provide platform-specific optimization suggestions', async () => {
    const genericPost = 'This was really good and I think people should check it out.'

    // Test across all three platforms
    const platforms = [
      { element: mockTwitterTextarea, platform: 'twitter' },
      { element: mockFacebookTextarea, platform: 'facebook' },
      { element: mockLinkedInTextarea, platform: 'linkedin' }
    ]

    const ContentScript = require('../../src/content/content-script')
    await ContentScript.initialize()

    const mockAIService = require('../../src/lib/services/ai-service')

    for (const { element, platform } of platforms) {
      element.textContent = genericPost
      element.focus()

      // Platform-specific improvements
      const expectedImprovements = {
        twitter: 'Amazing discovery! You need to check this out. 🔥 #MustSee',
        facebook: 'Found something incredible that I had to share with you all! Check it out and let me know what you think.',
        linkedin: 'Discovered a valuable resource that professionals in our network should explore. Highly recommended for its practical applications.'
      }

      mockAIService.analyzeText.mockResolvedValue({
        success: true,
        improvedText: expectedImprovements[platform],
        confidenceScore: 0.87,
        processingTime: 360,
        apiUsed: 'rewriter'
      })

      const clarityOverlay = document.querySelector('.isitclear-overlay')
      const analyzeButton = clarityOverlay.querySelector('.analyze-button')
      const acceptButton = clarityOverlay.querySelector('.accept-button')

      analyzeButton.click()
      await new Promise(resolve => setTimeout(resolve, 380))
      acceptButton.click()

      expect(element.textContent || element.value).toBe(expectedImprovements[platform])
    }
  })
})
