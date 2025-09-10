// ABOUTME: Background service worker for IsItClear extension - handles AI session management and cross-tab coordination
// ABOUTME: Manages Chrome AI API sessions, user preferences, and extension lifecycle

const AIService = require('../lib/services/ai-service')
const TextAnalyzer = require('../lib/services/text-analyzer')
const UserPreferences = require('../lib/models/user-preferences')
const { ExtensionState } = require('../lib/models/extension-state')

class BackgroundScript {
  constructor () {
    this.extensionState = ExtensionState.createInactive()
    this.userPreferences = null
    this.sessionCleanupInterval = null
    this.isInitialized = false
    this.analytics = {
      analysisCount: 0,
      acceptanceRate: 0,
      averageProcessingTime: 0
    }
  }

  async initialize () {
    if (this.isInitialized) return

    try {
      console.log('Initializing IsItClear background script')

      // Load user preferences
      await this._loadUserPreferences()

      // Set up message handling
      this._setupMessageHandling()

      // Set up context menus
      this._setupContextMenus()

      // Set up keyboard shortcuts
      this._setupKeyboardShortcuts()

      // Set up extension lifecycle events
      this._setupExtensionEvents()

      // Set up periodic maintenance
      this._setupMaintenance()

      this.isInitialized = true
      console.log('IsItClear background script initialized')
    } catch (error) {
      console.error('Failed to initialize background script:', error)
      this.extensionState.setError(error, 'BACKGROUND_INITIALIZATION_FAILED')
    }
  }

  async cleanup () {
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval)
      this.sessionCleanupInterval = null
    }

    // Clean up AI sessions
    await AIService.cleanup()

    this.isInitialized = false
  }

  // Private initialization methods
  async _loadUserPreferences () {
    try {
      this.userPreferences = await UserPreferences.loadFromStorage()
      console.log('User preferences loaded')
    } catch (error) {
      console.warn('Failed to load user preferences, using defaults:', error)
      this.userPreferences = new UserPreferences()
      await this.userPreferences.saveToStorage()
    }
  }

  _setupMessageHandling () {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this._handleMessage(message, sender, sendResponse)
      return true // Keep message channel open for async responses
    })
  }

  _setupContextMenus () {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'isitclear-analyze',
        title: 'Analyze for clarity',
        contexts: ['editable']
      })

      chrome.contextMenus.create({
        id: 'isitclear-settings',
        title: 'IsItClear Settings',
        contexts: ['page']
      })
    })

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this._handleContextMenuClick(info, tab)
    })
  }

  _setupKeyboardShortcuts () {
    chrome.commands.onCommand.addListener((command) => {
      this._handleKeyboardCommand(command)
    })
  }

  _setupExtensionEvents () {
    // Handle extension install/update
    chrome.runtime.onInstalled.addListener((details) => {
      this._handleInstalled(details)
    })

    // Handle extension startup
    chrome.runtime.onStartup.addListener(() => {
      this._handleStartup()
    })

    // Handle tab changes
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this._handleTabActivated(activeInfo)
    })
  }

  _setupMaintenance () {
    // Clean up AI sessions periodically (every 5 minutes)
    this.sessionCleanupInterval = setInterval(async () => {
      try {
        await this._performMaintenance()
      } catch (error) {
        console.error('Error during maintenance:', error)
      }
    }, 300000) // 5 minutes
  }

  // Message handling
  async _handleMessage (message, sender, sendResponse) {
    try {
      switch (message.type) {
      case 'ANALYZE_TEXT':
        const result = await this._handleAnalyzeText(message.payload)
        sendResponse(result)
        break

      case 'USER_ACTION':
        await this._handleUserAction(message.payload)
        sendResponse({ success: true })
        break

      case 'GET_PREFERENCES':
        sendResponse({
          success: true,
          preferences: this.userPreferences.toJSON()
        })
        break

      case 'UPDATE_PREFERENCES':
        const updated = await this._handleUpdatePreferences(message.payload)
        sendResponse(updated)
        break

      case 'GET_ANALYTICS':
        sendResponse({
          success: true,
          analytics: this.analytics
        })
        break

      case 'GET_EXTENSION_STATE':
        sendResponse({
          success: true,
          state: this.extensionState.toJSON(),
          aiServiceStatus: {
            sessionCount: AIService.getSessionCount(),
            availableApis: AIService.getAvailableApis()
          }
        })
        break

      default:
        sendResponse({ success: false, error: 'Unknown message type' })
      }
    } catch (error) {
      console.error('Error handling message:', error)
      sendResponse({ success: false, error: error.message })
    }
  }

  async _handleAnalyzeText (payload) {
    try {
      const { text, fieldType, fieldContext, userPreferences: clientPrefs } = payload

      // Update user preferences if provided
      if (clientPrefs) {
        this.userPreferences = UserPreferences.fromJSON(clientPrefs)
      }

      // Start analysis
      this.analytics.analysisCount++
      const startTime = Date.now()

      const result = await TextAnalyzer.analyzeText(text, {
        fieldType,
        fieldContext,
        userPreferences: this.userPreferences
      })

      // Update analytics
      const processingTime = Date.now() - startTime
      this._updateAnalytics('analysis_completed', { processingTime })

      return {
        success: true,
        result
      }
    } catch (error) {
      console.error('Error analyzing text:', error)
      this._updateAnalytics('analysis_failed', { error: error.message })

      return {
        success: false,
        error: error.message
      }
    }
  }

  async _handleUserAction (payload) {
    const { action, analysisResult } = payload

    // Update analytics
    this._updateAnalytics('user_action', { action, analysisResult })

    // Handle specific actions
    switch (action) {
    case 'accept':
      this._updateAcceptanceRate(true)
      break
    case 'reject':
      this._updateAcceptanceRate(false)
      break
    }
  }

  async _handleUpdatePreferences (newPreferences) {
    try {
      this.userPreferences = UserPreferences.fromJSON(newPreferences)
      await this.userPreferences.saveToStorage()

      // Notify all content scripts about preferences update
      const tabs = await chrome.tabs.query({})
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'PREFERENCES_UPDATED',
            payload: this.userPreferences.toJSON()
          })
        } catch (error) {
          // Tab might not have content script injected
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Error updating preferences:', error)
      return { success: false, error: error.message }
    }
  }

  // Event handlers
  async _handleContextMenuClick (info, tab) {
    try {
      if (info.menuItemId === 'isitclear-analyze') {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'CONTEXT_MENU_CLICKED',
          payload: { autoAnalyze: true }
        })
      } else if (info.menuItemId === 'isitclear-settings') {
        chrome.runtime.openOptionsPage()
      }
    } catch (error) {
      console.error('Error handling context menu click:', error)
    }
  }

  async _handleKeyboardCommand (command) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab) return

      switch (command) {
      case 'analyze-text':
        await chrome.tabs.sendMessage(tab.id, {
          type: 'ANALYZE_CURRENT_FIELD'
        })
        break

      case 'accept-suggestion':
        // This would be handled by content script
        break
      }
    } catch (error) {
      console.error('Error handling keyboard command:', error)
    }
  }

  _handleInstalled (details) {
    if (details.reason === 'install') {
      console.log('IsItClear extension installed')

      // Open welcome page or show notification
      this._showWelcomeNotification()
    } else if (details.reason === 'update') {
      console.log('IsItClear extension updated to version', chrome.runtime.getManifest().version)
    }
  }

  _handleStartup () {
    console.log('IsItClear extension startup')
    this.initialize()
  }

  _handleTabActivated (activeInfo) {
    // Could be used to track which tabs are using the extension
    // For now, just log for debugging
    console.log('Tab activated:', activeInfo.tabId)
  }

  // Analytics and maintenance
  _updateAnalytics (event, data = {}) {
    switch (event) {
    case 'analysis_completed':
      if (data.processingTime) {
        this.analytics.averageProcessingTime =
            (this.analytics.averageProcessingTime + data.processingTime) / 2
      }
      break

    case 'analysis_failed':
      // Log failure for debugging
      console.warn('Analysis failed:', data.error)
      break
    }
  }

  _updateAcceptanceRate (accepted) {
    const totalActions = this.analytics.analysisCount
    if (totalActions === 0) return

    const currentAccepted = this.analytics.acceptanceRate * (totalActions - 1)
    const newAccepted = accepted ? currentAccepted + 1 : currentAccepted
    this.analytics.acceptanceRate = newAccepted / totalActions
  }

  async _performMaintenance () {
    console.log('Performing background maintenance')

    // Clean up AI service sessions
    // (AIService has its own cleanup logic that runs automatically)

    // Clean up extension state
    await this.extensionState.performMaintenance()

    // Clean up text analyzer history if it gets too large
    const stats = TextAnalyzer.getAnalysisStatistics()
    if (stats.totalAnalyses > 100) {
      // Could implement history cleanup here
      console.log('Analysis history is getting large:', stats.totalAnalyses)
    }

    console.log('Background maintenance completed')
  }

  _showWelcomeNotification () {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'IsItClear Extension Installed',
      message: 'Start improving your text clarity on any website! Focus on a text field and use Ctrl+Shift+C.'
    })
  }

  // Public interface for debugging and testing
  getState () {
    return {
      isInitialized: this.isInitialized,
      extensionState: this.extensionState.toJSON(),
      userPreferences: this.userPreferences ? this.userPreferences.toJSON() : null,
      analytics: this.analytics,
      aiServiceStatus: {
        sessionCount: AIService.getSessionCount(),
        availableApis: AIService.getAvailableApis()
      }
    }
  }

  async forceCleanup () {
    await this._performMaintenance()
  }

  // Chrome API availability check
  _checkChromeAPIAvailability () {
    const availability = {
      rewriterAPI: typeof Rewriter !== 'undefined',
      promptAPI: typeof Prompt !== 'undefined',
      chromeVersion: navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || 'unknown'
    }

    console.log('Chrome AI API availability:', availability)
    return availability
  }
}

// Initialize background script
const backgroundScript = new BackgroundScript()

// Auto-initialize
backgroundScript.initialize()

// Handle service worker lifecycle
self.addEventListener('activate', (event) => {
  event.waitUntil(backgroundScript.initialize())
})

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = backgroundScript
}
