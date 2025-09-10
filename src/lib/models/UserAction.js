// ABOUTME: UserAction model for handling user interactions with clarity suggestions
// ABOUTME: Validates action types and associated data for extension communication

export class UserAction {
  constructor (data) {
    this.validateInput(data)

    this.action = data.action
    this.data = data.data || {}
    this.timestamp = new Date()
  }

  validateInput (data) {
    if (!['accept', 'reject', 'analyze', 'undo', 'settings'].includes(data.action)) {
      throw new Error('Invalid action type')
    }

    if (data.data && typeof data.data !== 'object') {
      throw new Error('Action data must be an object')
    }
  }

  toJSON () {
    return {
      action: this.action,
      data: this.data,
      timestamp: this.timestamp.toISOString()
    }
  }
}

export function validateUserAction (action) {
  if (!['accept', 'reject', 'analyze', 'undo', 'settings'].includes(action.action)) {
    throw new Error('Invalid action type')
  }

  return true
}
