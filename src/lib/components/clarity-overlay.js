// ABOUTME: UI overlay component for displaying clarity suggestions and user interaction
// ABOUTME: Creates and manages the floating overlay interface for text improvement

class ClarityOverlay {
  constructor () {
    this.overlay = null
    this.currentTargetElement = null
    this.currentAnalysisResult = null
    this.isVisible = false
    this.eventListeners = []

    // Configuration
    this.config = {
      overlayId: 'isitclear-overlay',
      className: 'isitclear-overlay',
      zIndex: 999999,
      maxWidth: 400,
      borderRadius: '8px',
      animationDuration: '200ms'
    }

    // Callbacks
    this.onAnalyze = null
    this.onAccept = null
    this.onReject = null
    this.onClose = null

    this._createStyles()
  }

  // Main interface methods
  show (targetElement, analysisResult = null) {
    if (!targetElement) {
      throw new Error('Target element is required')
    }

    this.currentTargetElement = targetElement
    this.currentAnalysisResult = analysisResult

    if (!this.overlay) {
      this._createOverlay()
    }

    this._updateContent(analysisResult)
    this._positionOverlay(targetElement)
    this._showOverlay()

    this.isVisible = true
  }

  hide () {
    if (this.overlay && this.isVisible) {
      this._hideOverlay()
      this.isVisible = false
    }
  }

  destroy () {
    this.hide()

    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay)
    }

    this._removeEventListeners()
    this.overlay = null
    this.currentTargetElement = null
    this.currentAnalysisResult = null
  }

  // Content update methods
  updateWithAnalysisResult (analysisResult) {
    this.currentAnalysisResult = analysisResult

    if (this.overlay && this.isVisible) {
      this._updateContent(analysisResult)
    }
  }

  showLoading (message = 'Analyzing text...') {
    if (this.overlay) {
      this._updateContent(null, { isLoading: true, loadingMessage: message })
    }
  }

  showError (error) {
    if (this.overlay) {
      this._updateContent(null, {
        isError: true,
        errorMessage: typeof error === 'string' ? error : error.message
      })
    }
  }

  showEmpty (message = 'No text to analyze') {
    if (this.overlay) {
      this._updateContent(null, { isEmpty: true, emptyMessage: message })
    }
  }

  // Private methods - Overlay creation
  _createOverlay () {
    this.overlay = document.createElement('div')
    this.overlay.id = this.config.overlayId
    this.overlay.className = this.config.className

    // Add to document
    document.body.appendChild(this.overlay)

    // Set up event listeners
    this._setupEventListeners()

    return this.overlay
  }

  _createStyles () {
    // Check if styles already exist
    if (document.getElementById('isitclear-styles')) {
      return
    }

    const style = document.createElement('style')
    style.id = 'isitclear-styles'
    style.textContent = `
      .${this.config.className} {
        position: fixed;
        z-index: ${this.config.zIndex};
        background: #ffffff;
        border: 1px solid #e1e5e9;
        border-radius: ${this.config.borderRadius};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: ${this.config.maxWidth}px;
        min-width: 280px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        opacity: 0;
        transform: translateY(-10px);
        transition: opacity ${this.config.animationDuration} ease, transform ${this.config.animationDuration} ease;
        pointer-events: none;
      }
      
      .${this.config.className}.visible {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }
      
      .${this.config.className}__header {
        padding: 12px 16px;
        border-bottom: 1px solid #e1e5e9;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #f8f9fa;
        border-radius: ${this.config.borderRadius} ${this.config.borderRadius} 0 0;
      }
      
      .${this.config.className}__title {
        font-weight: 600;
        color: #2c3e50;
        margin: 0;
        font-size: 14px;
      }
      
      .${this.config.className}__close {
        background: none;
        border: none;
        font-size: 18px;
        color: #6c757d;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .${this.config.className}__close:hover {
        background: #e9ecef;
        color: #495057;
      }
      
      .${this.config.className}__content {
        padding: 16px;
      }
      
      .${this.config.className}__loading {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #6c757d;
        font-style: italic;
      }
      
      .${this.config.className}__spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #e9ecef;
        border-top: 2px solid #007bff;
        border-radius: 50%;
        animation: isitclear-spin 1s linear infinite;
      }
      
      @keyframes isitclear-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .${this.config.className}__error {
        color: #dc3545;
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 12px;
      }
      
      .${this.config.className}__empty {
        color: #6c757d;
        font-style: italic;
        text-align: center;
        padding: 12px;
      }
      
      .${this.config.className}__improvement {
        margin-bottom: 16px;
      }
      
      .${this.config.className}__improvement-text {
        background: #f8f9fa;
        border-left: 4px solid #28a745;
        padding: 12px;
        border-radius: 0 4px 4px 0;
        margin: 8px 0;
        font-family: inherit;
        font-size: 13px;
        line-height: 1.5;
      }
      
      .${this.config.className}__confidence {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #6c757d;
        margin-top: 8px;
      }
      
      .${this.config.className}__confidence-bar {
        flex: 1;
        height: 4px;
        background: #e9ecef;
        border-radius: 2px;
        overflow: hidden;
      }
      
      .${this.config.className}__confidence-fill {
        height: 100%;
        background: linear-gradient(90deg, #dc3545, #ffc107, #28a745);
        transition: width 0.3s ease;
      }
      
      .${this.config.className}__actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      
      .${this.config.className}__button {
        padding: 8px 16px;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        background: #ffffff;
        color: #495057;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      
      .${this.config.className}__button:hover {
        background: #f8f9fa;
        border-color: #adb5bd;
      }
      
      .${this.config.className}__button--primary {
        background: #007bff;
        border-color: #007bff;
        color: #ffffff;
      }
      
      .${this.config.className}__button--primary:hover {
        background: #0056b3;
        border-color: #0056b3;
      }
      
      .${this.config.className}__button--analyze {
        background: #17a2b8;
        border-color: #17a2b8;
        color: #ffffff;
      }
      
      .${this.config.className}__button--analyze:hover {
        background: #138496;
        border-color: #117a8b;
      }
      
      .${this.config.className}__button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        pointer-events: none;
      }
      
      .${this.config.className}__feedback-message {
        text-align: center;
        color: #6c757d;
        font-style: italic;
        padding: 12px;
      }
    `

    document.head.appendChild(style)
  }

  // Content rendering methods
  _updateContent (analysisResult, state = {}) {
    if (!this.overlay) return

    const content = this.overlay.querySelector(`.${this.config.className}__content`)
    if (!content) return

    if (state.isLoading) {
      content.innerHTML = this._renderLoading(state.loadingMessage)
    } else if (state.isError) {
      content.innerHTML = this._renderError(state.errorMessage)
    } else if (state.isEmpty) {
      content.innerHTML = this._renderEmpty(state.emptyMessage)
    } else if (analysisResult) {
      content.innerHTML = this._renderAnalysisResult(analysisResult)
    } else {
      content.innerHTML = this._renderInitial()
    }
  }

  _renderLoading (message) {
    return `
      <div class="${this.config.className}__loading">
        <div class="${this.config.className}__spinner"></div>
        <span>${message}</span>
      </div>
    `
  }

  _renderError (errorMessage) {
    return `
      <div class="${this.config.className}__error">
        <strong>Error:</strong> ${errorMessage}
      </div>
      <div class="${this.config.className}__actions">
        <button class="${this.config.className}__button" data-action="close">Close</button>
      </div>
    `
  }

  _renderEmpty (message) {
    return `
      <div class="${this.config.className}__empty">
        ${message}
      </div>
      <div class="${this.config.className}__actions">
        <button class="${this.config.className}__button" data-action="close">Close</button>
      </div>
    `
  }

  _renderAnalysisResult (analysisResult) {
    const confidencePercent = Math.round(analysisResult.confidenceScore * 100)

    return `
      <div class="${this.config.className}__improvement">
        <div class="${this.config.className}__improvement-text">
          ${this._escapeHtml(analysisResult.improvedText)}
        </div>
        <div class="${this.config.className}__confidence">
          <span>Confidence:</span>
          <div class="${this.config.className}__confidence-bar">
            <div class="${this.config.className}__confidence-fill" 
                 style="width: ${confidencePercent}%"></div>
          </div>
          <span>${confidencePercent}%</span>
        </div>
      </div>
      <div class="${this.config.className}__actions">
        <button class="${this.config.className}__button" data-action="reject">Reject</button>
        <button class="${this.config.className}__button ${this.config.className}__button--primary" 
                data-action="accept">Accept</button>
      </div>
    `
  }

  _renderInitial () {
    return `
      <div class="${this.config.className}__feedback-message">
        Click "Analyze" to improve text clarity
      </div>
      <div class="${this.config.className}__actions">
        <button class="${this.config.className}__button ${this.config.className}__button--analyze" 
                data-action="analyze">Analyze for Clarity</button>
      </div>
    `
  }

  _renderHeader () {
    return `
      <div class="${this.config.className}__header">
        <h3 class="${this.config.className}__title">IsItClear</h3>
        <button class="${this.config.className}__close" data-action="close" aria-label="Close">×</button>
      </div>
    `
  }

  // Positioning methods
  _positionOverlay (targetElement) {
    if (!this.overlay || !targetElement) return

    const targetRect = targetElement.getBoundingClientRect()
    const overlayRect = this.overlay.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let left = targetRect.left
    let top = targetRect.bottom + 8

    // Adjust horizontal position if overlay would overflow
    if (left + overlayRect.width > viewportWidth - 16) {
      left = viewportWidth - overlayRect.width - 16
    }

    // Ensure minimum distance from left edge
    if (left < 16) {
      left = 16
    }

    // Adjust vertical position if overlay would overflow
    if (top + overlayRect.height > viewportHeight - 16) {
      // Position above the target element
      top = targetRect.top - overlayRect.height - 8

      // If still overflowing, position at top of viewport
      if (top < 16) {
        top = 16
      }
    }

    this.overlay.style.left = `${left}px`
    this.overlay.style.top = `${top}px`
  }

  // Animation methods
  _showOverlay () {
    if (!this.overlay) return

    // Ensure overlay has correct structure
    if (!this.overlay.querySelector(`.${this.config.className}__header`)) {
      this.overlay.innerHTML = this._renderHeader() +
        `<div class="${this.config.className}__content"></div>`

      // Update content after structure is created
      this._updateContent(this.currentAnalysisResult)
    }

    // Trigger animation
    requestAnimationFrame(() => {
      this.overlay.classList.add('visible')
    })
  }

  _hideOverlay () {
    if (!this.overlay) return

    this.overlay.classList.remove('visible')
  }

  // Event handling
  _setupEventListeners () {
    // Click handler for overlay actions
    const clickHandler = (event) => {
      const action = event.target.dataset.action
      if (!action) return

      event.preventDefault()
      event.stopPropagation()

      this._handleAction(action, event)
    }

    // Close on outside click
    const outsideClickHandler = (event) => {
      if (this.overlay && this.isVisible && !this.overlay.contains(event.target)) {
        this.hide()
      }
    }

    // Close on escape key
    const keyHandler = (event) => {
      if (event.key === 'Escape' && this.isVisible) {
        this.hide()
      }
    }

    this.overlay.addEventListener('click', clickHandler)
    document.addEventListener('click', outsideClickHandler)
    document.addEventListener('keydown', keyHandler)

    // Store for cleanup
    this.eventListeners = [
      { element: this.overlay, event: 'click', handler: clickHandler },
      { element: document, event: 'click', handler: outsideClickHandler },
      { element: document, event: 'keydown', handler: keyHandler }
    ]
  }

  _removeEventListeners () {
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler)
    })
    this.eventListeners = []
  }

  _handleAction (action, event) {
    switch (action) {
    case 'analyze':
      if (this.onAnalyze) {
        this.onAnalyze(this.currentTargetElement)
      }
      break

    case 'accept':
      if (this.onAccept) {
        this.onAccept(this.currentAnalysisResult, this.currentTargetElement)
      }
      break

    case 'reject':
      if (this.onReject) {
        this.onReject(this.currentAnalysisResult, this.currentTargetElement)
      }
      break

    case 'close':
      this.hide()
      if (this.onClose) {
        this.onClose()
      }
      break
    }
  }

  // Utility methods
  _escapeHtml (text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // Public configuration methods
  setCallbacks (callbacks) {
    this.onAnalyze = callbacks.onAnalyze || null
    this.onAccept = callbacks.onAccept || null
    this.onReject = callbacks.onReject || null
    this.onClose = callbacks.onClose || null
  }

  updateConfig (config) {
    this.config = { ...this.config, ...config }
  }

  // State query methods
  getState () {
    return {
      isVisible: this.isVisible,
      hasAnalysisResult: !!this.currentAnalysisResult,
      targetElement: this.currentTargetElement
    }
  }
}

module.exports = ClarityOverlay
