// ABOUTME: ExtensionMessage model for inter-component communication
// ABOUTME: Validates message structure for content script, background, and popup communication

export class ExtensionMessage {
  constructor (data) {
    this.validateInput(data)

    this.type = data.type
    this.payload = data.payload || {}
    this.timestamp = data.timestamp || new Date().toISOString()
    this.source = data.source
    this.target = data.target
  }

  validateInput (data) {
    const validTypes = [
      'INPUT_DETECTED',
      'ANALYZE_TEXT',
      'ANALYSIS_RESULT',
      'USER_ACTION',
      'UI_UPDATE',
      'ERROR',
      'PREFERENCES_CHANGED'
    ]

    if (!validTypes.includes(data.type)) {
      throw new Error('Invalid message type')
    }

    const validSources = ['content-script', 'background', 'popup', 'options']
    if (!validSources.includes(data.source)) {
      throw new Error('Invalid message source')
    }

    if (!validSources.includes(data.target)) {
      throw new Error('Invalid message target')
    }

    if (data.payload && typeof data.payload !== 'object') {
      throw new Error('Payload must be an object')
    }
  }

  toJSON () {
    return {
      type: this.type,
      payload: this.payload,
      timestamp: this.timestamp,
      source: this.source,
      target: this.target
    }
  }
}

export function validateExtensionMessage (message) {
  const validTypes = [
    'INPUT_DETECTED',
    'ANALYZE_TEXT',
    'ANALYSIS_RESULT',
    'USER_ACTION',
    'UI_UPDATE',
    'ERROR',
    'PREFERENCES_CHANGED'
  ]

  if (!validTypes.includes(message.type)) {
    throw new Error('Invalid message type')
  }

  const validSources = ['content-script', 'background', 'popup', 'options']
  if (!validSources.includes(message.source)) {
    throw new Error('Invalid message source')
  }

  if (!validSources.includes(message.target)) {
    throw new Error('Invalid message target')
  }

  return true
}

export async function handleExtensionMessage (message) {
  // This will be implemented in the message service
  throw new Error('handleExtensionMessage not implemented')
}
