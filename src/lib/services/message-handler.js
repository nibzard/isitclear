// ABOUTME: Message handler for extension component communication
// ABOUTME: Routes messages between content script, background worker, and popup

class MessageHandler {
  constructor () {
    this.messageTypes = new Set([
      'analyze_request',
      'analyze_response',
      'user_action',
      'ui_update',
      'settings_update',
      'error_notification'
    ])
    this.handlers = new Map()
    this._initializeHandlers()
  }

  _initializeHandlers () {
    this.handlers.set('analyze_request', this._handleAnalyzeRequest.bind(this))
    this.handlers.set('user_action', this._handleUserAction.bind(this))
    this.handlers.set('settings_update', this._handleSettingsUpdate.bind(this))
  }

  async routeMessage (message) {
    if (!message || typeof message !== 'object') {
      throw new Error('Message is required and must be an object')
    }

    const { type, data, timestamp } = message

    if (!type || !this.messageTypes.has(type)) {
      throw new Error(`Invalid message type: ${type}`)
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Message data is required and must be an object')
    }

    if (!timestamp || !(timestamp instanceof Date)) {
      throw new Error('Message timestamp is required and must be a Date object')
    }

    const handler = this.handlers.get(type)
    if (!handler) {
      return {
        success: false,
        error: `No handler registered for message type: ${type}`,
        timestamp: new Date()
      }
    }

    try {
      return await handler(message)
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      }
    }
  }

  async createMessage (messageData) {
    const { type, data, source, target } = messageData

    if (!type || !this.messageTypes.has(type)) {
      throw new Error('Invalid message type')
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Message data is required and must be an object')
    }

    if (!source || typeof source !== 'string') {
      throw new Error('Message source is required')
    }

    if (!target || typeof target !== 'string') {
      throw new Error('Message target is required')
    }

    return {
      type,
      data,
      source,
      target,
      timestamp: new Date(),
      messageId: this._generateMessageId()
    }
  }

  async _handleAnalyzeRequest (message) {
    const { data } = message

    return {
      success: true,
      type: 'analyze_response',
      data: {
        requestId: data.requestId,
        status: 'processing',
        estimatedTime: 500
      },
      timestamp: new Date()
    }
  }

  async _handleUserAction (message) {
    const { data } = message

    return {
      success: true,
      type: 'ui_update',
      data: {
        action: data.action,
        status: 'completed',
        feedback: 'Action processed successfully'
      },
      timestamp: new Date()
    }
  }

  async _handleSettingsUpdate (message) {
    const { data } = message

    return {
      success: true,
      type: 'settings_update',
      data: {
        settings: data.settings,
        applied: true
      },
      timestamp: new Date()
    }
  }

  _generateMessageId () {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

const instance = new MessageHandler()

module.exports = {
  MessageHandler,
  routeMessage: instance.routeMessage.bind(instance),
  createMessage: instance.createMessage.bind(instance)
}