// ABOUTME: Content script for IsItClear extension - handles webpage integration and user interactions
// ABOUTME: Manages input detection, overlay display, and communication with background script

const InputDetector = require('../lib/services/input-detector')
const TextAnalyzer = require('../lib/services/text-analyzer')
const ClarityOverlay = require('../lib/components/clarity-overlay')
const UserPreferences = require('../lib/models/user-preferences')
const { ExtensionState } = require('../lib/models/extension-state')

class ContentScript {
  constructor () {
    this.overlay = null
    this.extensionState = ExtensionState.createInactive()
    this.userPreferences = null
    this.inputDetectorCleanup = null
    this.keyboardShortcutHandler = null
    this.contextMenuHandler = null
    this.isInitialized = false
    this.processingInProgress = false
  }

  async initialize () {
    if (this.isInitialized) return

    try {
      // Load user preferences
      await this._loadUserPreferences()

      // Create overlay
      this._createOverlay()

      // Set up input field detection
      this._setupInputDetection()

      // Set up keyboard shortcuts
      this._setupKeyboardShortcuts()

      // Set up message handling
      this._setupMessageHandling()

      // Set up context menu
      this._setupContextMenu()

      this.isInitialized = true
      console.log('IsItClear content script initialized')
    } catch (error) {
      console.error('Failed to initialize IsItClear content script:', error)
      this.extensionState.setError(error, 'INITIALIZATION_FAILED')
    }
  }

  async cleanup () {
    if (this.inputDetectorCleanup) {
      this.inputDetectorCleanup()
      this.inputDetectorCleanup = null
    }

    if (this.overlay) {
      this.overlay.destroy()
      this.overlay = null
    }

    if (this.keyboardShortcutHandler) {
      document.removeEventListener('keydown', this.keyboardShortcutHandler)
      this.keyboardShortcutHandler = null
    }

    if (this.contextMenuHandler) {
      document.removeEventListener('contextmenu', this.contextMenuHandler)
      this.contextMenuHandler = null
    }

    this.extensionState.deactivate()
    this.isInitialized = false
  }

  // Private initialization methods
  async _loadUserPreferences () {
    try {
      this.userPreferences = await UserPreferences.loadFromStorage()
    } catch (error) {
      console.warn('Failed to load user preferences, using defaults:', error)
      this.userPreferences = new UserPreferences()
    }
  }

  _createOverlay () {
    this.overlay = new ClarityOverlay()

    this.overlay.setCallbacks({
      onAnalyze: (targetElement) => this._handleAnalyzeRequest(targetElement),
      onAccept: (analysisResult, targetElement) => this._handleAcceptSuggestion(analysisResult, targetElement),
      onReject: (analysisResult, targetElement) => this._handleRejectSuggestion(analysisResult, targetElement),
      onClose: () => this._handleCloseOverlay()
    })
  }

  _setupInputDetection () {
    this.inputDetectorCleanup = InputDetector.setupFieldDetection(
      (fieldData, element) => this._handleFieldDetected(fieldData, element),
      {
        detectOnFocus: true,
        detectOnInput: false,
        debounceMs: 150
      }
    )
  }

  _setupKeyboardShortcuts () {
    this.keyboardShortcutHandler = (event) => {
      if (this._matchesKeyboardShortcut(event)) {
        event.preventDefault()
        this._handleKeyboardShortcut(event)
      }
    }

    document.addEventListener('keydown', this.keyboardShortcutHandler, true)
  }

  _setupContextMenu () {
    // Note: Context menu creation is handled by background script
    // This sets up the handler for when context menu items are clicked
    this.contextMenuHandler = (event) => {
      // Store the target element for potential context menu action
      this._contextMenuTarget = event.target
    }

    document.addEventListener('contextmenu', this.contextMenuHandler, true)
  }

  _setupMessageHandling () {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this._handleMessage(message, sender, sendResponse)
      return true // Keep message channel open for async responses
    })
  }

  // Event handlers
  async _handleFieldDetected (fieldData, element) {
    try {
      // Check if extension should be active for this domain
      const currentUrl = window.location.href
      if (this.userPreferences.isDomainDisabled(currentUrl)) {
        return
      }

      // Activate extension state
      this.extensionState.activate(element)

      // Check if should auto-activate
      if (this.userPreferences.shouldAutoActivate(fieldData.text.length, this._countWords(fieldData.text))) {
        // Show overlay immediately
        this.overlay.show(element)
      } else if (this.userPreferences.isManualActivation() && fieldData.text.trim().length > 0) {
        // Show overlay without auto-analysis
        this.overlay.show(element)
      }
    } catch (error) {
      console.error('Error handling field detection:', error)
      this.extensionState.setError(error, 'FIELD_DETECTION_ERROR')
    }
  }

  async _handleAnalyzeRequest (targetElement) {
    if (this.processingInProgress) return

    try {
      this.processingInProgress = true
      this.overlay.showLoading('Analyzing text...')

      // Get current text from element
      const fieldData = await InputDetector.detectField(targetElement)

      if (!fieldData.text || fieldData.text.trim().length === 0) {
        this.overlay.showEmpty('No text to analyze')
        return
      }

      // Start processing
      this.extensionState.startProcessing()

      // Request analysis from background script (which manages AI sessions)
      const response = await this._sendMessage({
        type: 'ANALYZE_TEXT',
        payload: {
          text: fieldData.text,
          fieldType: fieldData.fieldType,
          fieldContext: fieldData.element,
          userPreferences: this.userPreferences.toJSON()
        }
      })

      if (response.success) {
        // Update overlay with results
        this.overlay.updateWithAnalysisResult(response.result)
        this.extensionState.completeProcessing()
      } else {
        this.overlay.showError(response.error || 'Analysis failed')
        this.extensionState.setError(new Error(response.error), 'ANALYSIS_FAILED')
      }
    } catch (error) {
      console.error('Error during text analysis:', error)
      this.overlay.showError('Failed to analyze text')
      this.extensionState.setError(error, 'ANALYSIS_REQUEST_ERROR')
    } finally {
      this.processingInProgress = false
    }
  }

  async _handleAcceptSuggestion (analysisResult, targetElement) {
    try {
      // Replace text in the element
      await InputDetector.replaceText(targetElement, analysisResult.improvedText, true)

      // Update extension state
      this.extensionState.completeProcessing()

      // Hide overlay
      this.overlay.hide()

      // Send analytics event
      this._sendMessage({
        type: 'USER_ACTION',
        payload: {
          action: 'accept',
          analysisResult,
          fieldContext: await InputDetector.detectField(targetElement)
        }
      })
    } catch (error) {
      console.error('Error accepting suggestion:', error)
      this.overlay.showError('Failed to apply suggestion')
    }
  }

  async _handleRejectSuggestion (analysisResult, targetElement) {
    try {
      // Just hide overlay, keep original text
      this.overlay.hide()

      // Update extension state
      this.extensionState.completeProcessing()

      // Send analytics event
      this._sendMessage({
        type: 'USER_ACTION',
        payload: {
          action: 'reject',
          analysisResult,
          fieldContext: await InputDetector.detectField(targetElement)
        }
      })
    } catch (error) {
      console.error('Error handling rejection:', error)
    }
  }

  _handleCloseOverlay () {
    this.overlay.hide()
    this.extensionState.deactivate()
  }

  _handleKeyboardShortcut (event) {
    const activeElement = document.activeElement

    if (InputDetector.isValidInputField(activeElement)) {
      if (this.overlay.isVisible) {
        this._handleAnalyzeRequest(activeElement)
      } else {
        this.overlay.show(activeElement)
      }
    }
  }

  async _handleMessage (message, sender, sendResponse) {
    try {
      switch (message.type) {
      case 'CONTEXT_MENU_CLICKED':
        await this._handleContextMenuAction(message.payload)
        sendResponse({ success: true })
        break

      case 'ANALYZE_CURRENT_FIELD':
        const activeElement = document.activeElement
        if (InputDetector.isValidInputField(activeElement)) {
          this.overlay.show(activeElement)
          await this._handleAnalyzeRequest(activeElement)
          sendResponse({ success: true })
        } else {
          sendResponse({ success: false, error: 'No active input field' })
        }
        break

      case 'PREFERENCES_UPDATED':
        await this._handlePreferencesUpdate(message.payload)
        sendResponse({ success: true })
        break

      case 'GET_STATE':
        sendResponse({
          success: true,
          state: this.extensionState.toJSON(),
          overlayState: this.overlay ? this.overlay.getState() : null
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

  async _handleContextMenuAction (payload) {
    if (this._contextMenuTarget && InputDetector.isValidInputField(this._contextMenuTarget)) {
      this.overlay.show(this._contextMenuTarget)

      if (payload.autoAnalyze) {
        await this._handleAnalyzeRequest(this._contextMenuTarget)
      }
    }
  }

  async _handlePreferencesUpdate (newPreferences) {
    try {
      this.userPreferences = UserPreferences.fromJSON(newPreferences)

      // Update keyboard shortcut if changed
      if (this.keyboardShortcutHandler) {
        document.removeEventListener('keydown', this.keyboardShortcutHandler, true)
        this._setupKeyboardShortcuts()
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
    }
  }

  // Helper methods
  _matchesKeyboardShortcut (event) {
    if (!this.userPreferences) return false

    const shortcut = this.userPreferences.keyboardShortcut
    const parts = shortcut.split('+')

    const key = parts[parts.length - 1]
    const modifiers = parts.slice(0, -1)

    if (event.key !== key && event.code !== `Key${key}`) {
      return false
    }

    for (const modifier of modifiers) {
      switch (modifier) {
      case 'Ctrl':
        if (!event.ctrlKey) return false
        break
      case 'Cmd':
        if (!event.metaKey) return false
        break
      case 'Alt':
        if (!event.altKey) return false
        break
      case 'Shift':
        if (!event.shiftKey) return false
        break
      }
    }

    return true
  }

  _countWords (text) {
    if (!text) return 0
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  async _sendMessage (message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(response)
        }
      })
    })
  }

  // Public interface for testing and debugging
  getState () {
    return {
      isInitialized: this.isInitialized,
      processingInProgress: this.processingInProgress,
      extensionState: this.extensionState.toJSON(),
      overlayVisible: this.overlay ? this.overlay.isVisible : false,
      userPreferences: this.userPreferences ? this.userPreferences.toJSON() : null
    }
  }

  async forceAnalyze (element) {
    if (InputDetector.isValidInputField(element)) {
      this.overlay.show(element)
      await this._handleAnalyzeRequest(element)
    } else {
      throw new Error('Element is not a valid input field')
    }
  }
}

// Initialize content script
const contentScript = new ContentScript()

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    contentScript.initialize()
  })
} else {
  // DOM is already ready
  contentScript.initialize()
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  contentScript.cleanup()
})

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = contentScript
}
