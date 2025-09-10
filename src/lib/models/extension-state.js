// ABOUTME: ExtensionState model for managing current state of the extension and active sessions
// ABOUTME: Handles state transitions, AI session management, and processing queue

class ErrorInfo {
  constructor (code, message, timestamp = new Date(), context = {}) {
    this.code = code
    this.message = message
    this.timestamp = timestamp
    this.context = context
  }

  static fromError (error, code = 'UNKNOWN_ERROR', context = {}) {
    return new ErrorInfo(
      code,
      error.message || 'Unknown error occurred',
      new Date(),
      { ...context, stack: error.stack }
    )
  }

  toJSON () {
    return {
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      context: this.context
    }
  }
}

class ExtensionState {
  constructor () {
    this.isActive = false
    this.currentField = null
    this.aiSession = null
    this.processingQueue = []
    this.lastError = null
    this.currentState = 'Inactive'
    this.lastActivity = new Date()
    this.sessionHistory = []
    this.currentAnalysis = null
  }

  // State transition methods
  activate (fieldElement) {
    if (this.isActive && this.currentField === fieldElement) {
      return // Already active for this field
    }

    this.isActive = true
    this.currentField = fieldElement
    this.currentState = 'Active'
    this.lastActivity = new Date()
    this._clearError()
  }

  deactivate () {
    this.isActive = false
    this.currentField = null
    this.currentState = 'Inactive'
    this.lastActivity = new Date()
    this._clearProcessingQueue()
  }

  startProcessing (textContent) {
    if (!this.isActive) {
      throw new Error('Cannot start processing when extension is inactive')
    }

    this.currentState = 'Processing'
    this.currentAnalysis = textContent
    this.lastActivity = new Date()
    this._clearError()
  }

  completeProcessing (clarityImprovement) {
    if (this.currentState !== 'Processing') {
      throw new Error(`Cannot complete processing from state: ${this.currentState}`)
    }

    this.currentState = 'Completed'
    this.currentAnalysis = null
    this.lastActivity = new Date()

    // Add to session history
    this._addToSessionHistory('analysis_completed', {
      improvement: clarityImprovement ? clarityImprovement.getSummary() : null
    })
  }

  setError (error, code = 'UNKNOWN_ERROR', context = {}) {
    this.lastError = error instanceof ErrorInfo ? error : ErrorInfo.fromError(error, code, context)
    this.currentState = 'Error'
    this.lastActivity = new Date()

    this._addToSessionHistory('error_occurred', {
      error: this.lastError.toJSON()
    })
  }

  _clearError () {
    this.lastError = null
  }

  _clearProcessingQueue () {
    this.processingQueue = []
  }

  _addToSessionHistory (event, data = {}) {
    this.sessionHistory.push({
      event,
      timestamp: new Date(),
      data
    })

    // Keep only last 50 events
    if (this.sessionHistory.length > 50) {
      this.sessionHistory = this.sessionHistory.slice(-50)
    }
  }

  // AI Session management
  async createAISession (apiType, parameters = {}) {
    try {
      let session = null

      if (apiType === 'rewriter' && typeof Rewriter !== 'undefined') {
        session = await Rewriter.create(parameters)
      } else if (apiType === 'prompt' && typeof Prompt !== 'undefined') {
        session = await Prompt.create(parameters)
      } else {
        throw new Error(`AI API not available: ${apiType}`)
      }

      this.aiSession = {
        id: this._generateSessionId(),
        type: apiType,
        session,
        parameters,
        createdAt: new Date(),
        lastUsed: new Date()
      }

      this._addToSessionHistory('session_created', {
        sessionId: this.aiSession.id,
        type: apiType
      })

      return this.aiSession
    } catch (error) {
      this.setError(error, 'SESSION_CREATION_FAILED', { apiType, parameters })
      throw error
    }
  }

  async destroyAISession () {
    if (this.aiSession && this.aiSession.session && this.aiSession.session.destroy) {
      try {
        await this.aiSession.session.destroy()

        this._addToSessionHistory('session_destroyed', {
          sessionId: this.aiSession.id
        })
      } catch (error) {
        console.warn('Failed to destroy AI session:', error)
      }
    }

    this.aiSession = null
  }

  hasActiveSession () {
    return this.aiSession !== null
  }

  getSessionAge () {
    if (!this.aiSession) return null
    return Date.now() - this.aiSession.createdAt.getTime()
  }

  updateSessionLastUsed () {
    if (this.aiSession) {
      this.aiSession.lastUsed = new Date()
    }
  }

  _generateSessionId () {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }

  // Processing queue management
  addToProcessingQueue (textContent) {
    if (this.processingQueue.length >= 10) {
      // Remove oldest item if queue is full
      this.processingQueue.shift()
    }

    this.processingQueue.push({
      textContent,
      queuedAt: new Date(),
      id: this._generateQueueId()
    })
  }

  getNextFromQueue () {
    return this.processingQueue.shift()
  }

  getQueueLength () {
    return this.processingQueue.length
  }

  isQueueEmpty () {
    return this.processingQueue.length === 0
  }

  clearQueue () {
    this._clearProcessingQueue()
  }

  _generateQueueId () {
    return `queue_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }

  // State query methods
  isInactive () {
    return this.currentState === 'Inactive'
  }

  isActive () {
    return this.currentState === 'Active'
  }

  isProcessing () {
    return this.currentState === 'Processing'
  }

  isCompleted () {
    return this.currentState === 'Completed'
  }

  isError () {
    return this.currentState === 'Error'
  }

  canStartProcessing () {
    return this.isActive || this.isCompleted()
  }

  hasRecentActivity (timeoutMs = 30000) {
    return (Date.now() - this.lastActivity.getTime()) < timeoutMs
  }

  // Field management
  setCurrentField (fieldElement) {
    this.currentField = fieldElement
    this.lastActivity = new Date()
  }

  getCurrentFieldInfo () {
    if (!this.currentField) return null

    return {
      tagName: this.currentField.tagName,
      type: this.currentField.type,
      id: this.currentField.id,
      className: this.currentField.className,
      value: this.currentField.value || this.currentField.textContent
    }
  }

  // Session cleanup and maintenance
  shouldCleanupSession (maxIdleTimeMs = 300000) { // 5 minutes
    if (!this.aiSession) return false

    const idleTime = Date.now() - this.aiSession.lastUsed.getTime()
    return idleTime > maxIdleTimeMs
  }

  async performMaintenance () {
    // Cleanup old session if idle too long
    if (this.shouldCleanupSession()) {
      await this.destroyAISession()
    }

    // Clear old queue items (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 300000
    this.processingQueue = this.processingQueue.filter(
      item => item.queuedAt.getTime() > fiveMinutesAgo
    )

    // Clear old session history (keep only last 24 hours)
    const oneDayAgo = Date.now() - 86400000
    this.sessionHistory = this.sessionHistory.filter(
      event => event.timestamp.getTime() > oneDayAgo
    )
  }

  // Debug and monitoring methods
  getDebugInfo () {
    return {
      state: this.currentState,
      isActive: this.isActive,
      hasCurrentField: !!this.currentField,
      hasAISession: !!this.aiSession,
      queueLength: this.processingQueue.length,
      hasError: !!this.lastError,
      sessionAge: this.getSessionAge(),
      lastActivity: this.lastActivity.toISOString(),
      historyCount: this.sessionHistory.length
    }
  }

  getSessionStats () {
    const events = this.sessionHistory.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1
      return acc
    }, {})

    const errors = this.sessionHistory
      .filter(event => event.event === 'error_occurred')
      .map(event => event.data.error)

    return {
      totalEvents: this.sessionHistory.length,
      eventCounts: events,
      recentErrors: errors.slice(-5), // Last 5 errors
      uptime: Date.now() - (this.sessionHistory[0]?.timestamp.getTime() || Date.now())
    }
  }

  // Serialization (for debugging only - not persistent)
  toJSON () {
    return {
      currentState: this.currentState,
      isActive: this.isActive,
      hasCurrentField: !!this.currentField,
      currentFieldInfo: this.getCurrentFieldInfo(),
      hasAISession: !!this.aiSession,
      aiSessionInfo: this.aiSession
        ? {
          id: this.aiSession.id,
          type: this.aiSession.type,
          createdAt: this.aiSession.createdAt.toISOString(),
          lastUsed: this.aiSession.lastUsed.toISOString()
        }
        : null,
      queueLength: this.processingQueue.length,
      lastError: this.lastError ? this.lastError.toJSON() : null,
      lastActivity: this.lastActivity.toISOString(),
      sessionHistoryCount: this.sessionHistory.length
    }
  }

  // Static factory methods
  static createInactive () {
    return new ExtensionState()
  }

  static createForField (fieldElement) {
    const state = new ExtensionState()
    state.activate(fieldElement)
    return state
  }
}

module.exports = { ExtensionState, ErrorInfo }
