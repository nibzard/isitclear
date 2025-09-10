// ABOUTME: Action processor for handling user interactions with clarity improvements
// ABOUTME: Processes accept, reject, and analyze actions with proper validation

class ActionProcessor {
  constructor () {
    this.validators = new Map()
    this.handlers = new Map()
    this._initializeValidators()
    this._initializeHandlers()
  }

  _initializeValidators () {
    this.validators.set('accept', this._validateAcceptAction.bind(this))
    this.validators.set('reject', this._validateRejectAction.bind(this))
    this.validators.set('analyze', this._validateAnalyzeAction.bind(this))
  }

  _initializeHandlers () {
    this.handlers.set('accept', this._handleAcceptAction.bind(this))
    this.handlers.set('reject', this._handleRejectAction.bind(this))
    this.handlers.set('analyze', this._handleAnalyzeAction.bind(this))
  }

  async processUserAction (userAction) {
    if (!userAction || typeof userAction !== 'object') {
      throw new Error('User action is required and must be an object')
    }

    const { actionType, improvementId, timestamp } = userAction

    if (!actionType || !this.validators.has(actionType)) {
      throw new Error(`Invalid action type: ${actionType}`)
    }

    if (!improvementId || typeof improvementId !== 'string') {
      throw new Error('Improvement ID is required and must be a string')
    }

    if (!timestamp || !(timestamp instanceof Date)) {
      throw new Error('Timestamp is required and must be a Date object')
    }

    const validator = this.validators.get(actionType)
    await validator(userAction)

    const handler = this.handlers.get(actionType)
    return await handler(userAction)
  }

  _validateAcceptAction (action) {
    if (!action.improvementData || typeof action.improvementData !== 'object') {
      throw new Error('Accept action requires improvement data')
    }

    const { improvementData } = action
    if (!improvementData.improvedText || typeof improvementData.improvedText !== 'string') {
      throw new Error('Improvement data must include improved text')
    }
  }

  _validateRejectAction (action) {
    if (!action.reason || typeof action.reason !== 'string') {
      throw new Error('Reject action requires a reason')
    }
  }

  _validateAnalyzeAction (action) {
    if (!action.textContent || typeof action.textContent !== 'object') {
      throw new Error('Analyze action requires text content')
    }

    const { textContent } = action
    if (!textContent.originalText || typeof textContent.originalText !== 'string') {
      throw new Error('Text content must include original text')
    }
  }

  async _handleAcceptAction (action) {
    const { improvementId, improvementData, timestamp } = action

    return {
      success: true,
      actionType: 'accept',
      improvementId,
      processedAt: timestamp,
      result: {
        textApplied: improvementData.improvedText,
        confidenceAccepted: improvementData.confidenceScore,
        processingTime: Date.now() - timestamp.getTime()
      }
    }
  }

  async _handleRejectAction (action) {
    const { improvementId, reason, timestamp } = action

    return {
      success: true,
      actionType: 'reject',
      improvementId,
      processedAt: timestamp,
      result: {
        rejectionReason: reason,
        feedbackCaptured: true,
        processingTime: Date.now() - timestamp.getTime()
      }
    }
  }

  async _handleAnalyzeAction (action) {
    const { improvementId, textContent, timestamp } = action

    return {
      success: true,
      actionType: 'analyze',
      improvementId,
      processedAt: timestamp,
      result: {
        analysisRequested: true,
        textLength: textContent.originalText.length,
        processingTime: Date.now() - timestamp.getTime()
      }
    }
  }
}

const instance = new ActionProcessor()

module.exports = {
  ActionProcessor,
  processUserAction: instance.processUserAction.bind(instance)
}