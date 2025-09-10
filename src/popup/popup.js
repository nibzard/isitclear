// ABOUTME: Popup interface JavaScript for IsItClear extension
// ABOUTME: Handles popup UI interactions, settings, and communication with background script

class PopupInterface {
  constructor () {
    this.backgroundResponse = null
    this.currentPreferences = null
    this.updateInProgress = false
  }

  async initialize () {
    try {
      // Load initial data
      await this._loadExtensionState()
      await this._loadUserPreferences()
      await this._checkAIAvailability()

      // Set up event listeners
      this._setupEventListeners()

      // Update UI
      this._updateStatusDisplay()
      this._updatePreferencesUI()
      this._loadStatistics()

      console.log('Popup initialized successfully')
    } catch (error) {
      console.error('Failed to initialize popup:', error)
      this._showError('Failed to load extension data')
    }
  }

  // Data loading methods
  async _loadExtensionState () {
    try {
      const response = await this._sendMessage({ type: 'GET_EXTENSION_STATE' })
      if (response.success) {
        this.backgroundResponse = response
      } else {
        throw new Error(response.error)
      }
    } catch (error) {
      console.error('Error loading extension state:', error)
      throw error
    }
  }

  async _loadUserPreferences () {
    try {
      const response = await this._sendMessage({ type: 'GET_PREFERENCES' })
      if (response.success) {
        this.currentPreferences = response.preferences
      } else {
        throw new Error(response.error)
      }
    } catch (error) {
      console.error('Error loading user preferences:', error)
      throw error
    }
  }

  async _checkAIAvailability () {
    try {
      // Check if AI APIs are available
      const rewriterAvailable = typeof Rewriter !== 'undefined'
      const promptAvailable = typeof Prompt !== 'undefined'

      this._updateAIStatus('rewriter', rewriterAvailable)
      this._updateAIStatus('prompt', promptAvailable)

      // Get Chrome version
      const chromeVersion = this._getChromeVersion()
      document.getElementById('chrome-version').textContent = `Chrome Version: ${chromeVersion}`
    } catch (error) {
      console.error('Error checking AI availability:', error)
    }
  }

  async _loadStatistics () {
    try {
      const response = await this._sendMessage({ type: 'GET_ANALYTICS' })
      if (response.success) {
        this._updateStatisticsDisplay(response.analytics)
        // Show statistics section if there's data
        if (response.analytics.analysisCount > 0) {
          document.getElementById('stats-section').style.display = 'block'
        }
      }
    } catch (error) {
      console.error('Error loading statistics:', error)
    }
  }

  // Event handler setup
  _setupEventListeners () {
    // Analyze button
    document.getElementById('analyze-button').addEventListener('click', () => {
      this._handleAnalyzeClick()
    })

    // Settings button
    document.getElementById('settings-button').addEventListener('click', () => {
      this._handleSettingsClick()
    })

    // Help button
    document.getElementById('help-button').addEventListener('click', () => {
      this._handleHelpClick()
    })

    // Feedback button
    document.getElementById('feedback-button').addEventListener('click', () => {
      this._handleFeedbackClick()
    })

    // Settings controls
    document.getElementById('activation-method').addEventListener('change', (e) => {
      this._handlePreferenceChange('activationMethod', e.target.value)
    })

    document.getElementById('preferred-tone').addEventListener('change', (e) => {
      this._handlePreferenceChange('preferredTone', e.target.value)
    })

    document.getElementById('show-change-details').addEventListener('change', (e) => {
      this._handlePreferenceChange('showChangeDetails', e.target.checked)
    })
  }

  // Event handlers
  async _handleAnalyzeClick () {
    const button = document.getElementById('analyze-button')
    const originalText = button.innerHTML

    try {
      button.disabled = true
      button.innerHTML = '<span class="button-icon">⏳</span><span class="button-text">Analyzing...</span>'

      // Get current active tab and send analyze request
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'ANALYZE_CURRENT_FIELD'
      })

      if (response.success) {
        this._showSuccess('Analysis started')
        window.close() // Close popup as analysis will show in content overlay
      } else {
        this._showError(response.error || 'No active input field found')
      }
    } catch (error) {
      console.error('Error triggering analysis:', error)
      this._showError('Failed to analyze current field')
    } finally {
      button.disabled = false
      button.innerHTML = originalText
    }
  }

  _handleSettingsClick () {
    // Open full settings page
    chrome.runtime.openOptionsPage()
    window.close()
  }

  _handleHelpClick () {
    // Open help documentation
    chrome.tabs.create({
      url: 'https://github.com/anthropics/isitclear/wiki/help'
    })
    window.close()
  }

  _handleFeedbackClick () {
    // Open feedback form
    chrome.tabs.create({
      url: 'https://github.com/anthropics/isitclear/issues/new'
    })
    window.close()
  }

  async _handlePreferenceChange (key, value) {
    if (this.updateInProgress) return

    try {
      this.updateInProgress = true

      // Update local preferences object
      this.currentPreferences[key] = value

      // Send update to background script
      const response = await this._sendMessage({
        type: 'UPDATE_PREFERENCES',
        payload: this.currentPreferences
      })

      if (response.success) {
        this._showSuccess('Settings updated')
      } else {
        throw new Error(response.error)
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
      this._showError('Failed to update settings')

      // Revert UI change
      this._updatePreferencesUI()
    } finally {
      this.updateInProgress = false
    }
  }

  // UI update methods
  _updateStatusDisplay () {
    const statusCard = document.getElementById('status-card')
    const statusIndicator = document.getElementById('status-indicator')
    const statusTitle = document.getElementById('status-title')
    const statusSubtitle = document.getElementById('status-subtitle')
    const analyzeButton = document.getElementById('analyze-button')

    if (!this.backgroundResponse) {
      statusTitle.textContent = 'Extension Error'
      statusSubtitle.textContent = 'Failed to connect to background script'
      statusIndicator.className = 'status-indicator error'
      analyzeButton.disabled = true
      return
    }

    const state = this.backgroundResponse.state
    const aiStatus = this.backgroundResponse.aiServiceStatus

    if (!aiStatus.availableApis || aiStatus.availableApis.length === 0) {
      statusTitle.textContent = 'AI Not Available'
      statusSubtitle.textContent = 'Chrome AI APIs are not available'
      statusIndicator.className = 'status-indicator error'
      analyzeButton.disabled = true
    } else {
      statusTitle.textContent = 'Ready to Analyze'
      statusSubtitle.textContent = `${aiStatus.availableApis.join(', ')} available`
      statusIndicator.className = 'status-indicator'
      analyzeButton.disabled = false
    }
  }

  _updatePreferencesUI () {
    if (!this.currentPreferences) return

    // Activation method
    const activationSelect = document.getElementById('activation-method')
    activationSelect.value = this.currentPreferences.activationMethod || 'auto'

    // Preferred tone
    const toneSelect = document.getElementById('preferred-tone')
    toneSelect.value = this.currentPreferences.preferredTone || 'neutral'

    // Show change details
    const showDetailsCheckbox = document.getElementById('show-change-details')
    showDetailsCheckbox.checked = this.currentPreferences.showChangeDetails !== false
  }

  _updateStatisticsDisplay (analytics) {
    // Analysis count
    const analysisCount = document.getElementById('analysis-count')
    analysisCount.textContent = analytics.analysisCount || 0

    // Acceptance rate
    const acceptanceRate = document.getElementById('acceptance-rate')
    const rate = Math.round((analytics.acceptanceRate || 0) * 100)
    acceptanceRate.textContent = `${rate}%`

    // Average processing time
    const avgTime = document.getElementById('avg-processing-time')
    const time = Math.round(analytics.averageProcessingTime || 0)
    avgTime.textContent = `${time}ms`
  }

  _updateAIStatus (apiName, available) {
    const statusElement = document.getElementById(`${apiName}-status`)
    if (statusElement) {
      statusElement.textContent = available ? 'Available' : 'Unavailable'
      statusElement.className = `api-status ${available ? 'available' : 'unavailable'}`
    }
  }

  // Utility methods
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

  _getChromeVersion () {
    const match = navigator.userAgent.match(/Chrome\/(\d+)/)
    return match ? match[1] : 'Unknown'
  }

  _showSuccess (message) {
    // Simple success indication - could be enhanced with a toast/notification
    console.log('Success:', message)

    // Brief visual feedback
    document.body.style.backgroundColor = '#d4edda'
    setTimeout(() => {
      document.body.style.backgroundColor = '#f8f9fa'
    }, 500)
  }

  _showError (message) {
    // Simple error indication - could be enhanced with a toast/notification
    console.error('Error:', message)

    // Brief visual feedback
    document.body.style.backgroundColor = '#f8d7da'
    setTimeout(() => {
      document.body.style.backgroundColor = '#f8f9fa'
    }, 1000)

    // Update status display
    const statusTitle = document.getElementById('status-title')
    const statusSubtitle = document.getElementById('status-subtitle')
    const statusIndicator = document.getElementById('status-indicator')

    statusTitle.textContent = 'Error'
    statusSubtitle.textContent = message
    statusIndicator.className = 'status-indicator error'
  }

  // Refresh data method for testing
  async refresh () {
    await this.initialize()
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const popup = new PopupInterface()
  popup.initialize()

  // Make available globally for debugging
  window.popupInterface = popup
})
