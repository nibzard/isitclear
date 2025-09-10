// ABOUTME: UIState model for managing extension overlay state and positioning
// ABOUTME: Tracks visibility, position, mode, and progress for user interface

export class UIState {
  constructor (data) {
    this.validateInput(data)

    this.visible = data.visible
    this.position = data.position
    this.mode = data.mode || 'idle'
    this.progress = data.progress || 0
  }

  validateInput (data) {
    if (typeof data.visible !== 'boolean') {
      throw new Error('Visible must be a boolean')
    }

    if (!data.position || typeof data.position.x !== 'number' || typeof data.position.y !== 'number') {
      throw new Error('Position must have numeric x and y coordinates')
    }

    if (data.mode && !['idle', 'analyzing', 'showing-results', 'error'].includes(data.mode)) {
      throw new Error('Invalid UI mode')
    }

    if (data.progress !== undefined && (typeof data.progress !== 'number' || data.progress < 0 || data.progress > 100)) {
      throw new Error('Progress must be between 0 and 100')
    }
  }

  updatePosition (x, y) {
    this.position = { x, y }
  }

  setMode (mode) {
    if (!['idle', 'analyzing', 'showing-results', 'error'].includes(mode)) {
      throw new Error('Invalid UI mode')
    }
    this.mode = mode
  }

  setProgress (progress) {
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100')
    }
    this.progress = progress
  }

  toJSON () {
    return {
      visible: this.visible,
      position: this.position,
      mode: this.mode,
      progress: this.progress
    }
  }
}

export function validateUIState (state) {
  if (typeof state.visible !== 'boolean') {
    throw new Error('Visible must be a boolean')
  }

  if (!state.position || typeof state.position.x !== 'number' || typeof state.position.y !== 'number') {
    throw new Error('Position must have numeric x and y coordinates')
  }

  if (state.mode && !['idle', 'analyzing', 'showing-results', 'error'].includes(state.mode)) {
    throw new Error('Invalid UI mode')
  }

  if (state.progress !== undefined && (typeof state.progress !== 'number' || state.progress < 0 || state.progress > 100)) {
    throw new Error('Progress must be between 0 and 100')
  }

  return true
}
