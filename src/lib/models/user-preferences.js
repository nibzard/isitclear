// ABOUTME: UserPreferences model for storing user configuration and behavior preferences
// ABOUTME: Handles preference validation, persistence, and default value management

class UserPreferences {
  constructor (preferences = {}) {
    // Set defaults
    this.activationMethod = preferences.activationMethod || 'auto'
    this.keyboardShortcut = preferences.keyboardShortcut || 'Ctrl+Shift+C'
    this.autoActivateMinWords = preferences.autoActivateMinWords || 3
    this.preferredTone = preferences.preferredTone || 'neutral'
    this.showChangeDetails = preferences.showChangeDetails !== undefined ? preferences.showChangeDetails : true
    this.enabledDomains = preferences.enabledDomains || []
    this.disabledDomains = preferences.disabledDomains || []
    this.lastModified = new Date()

    this._validate()
  }

  _validate () {
    const validActivationMethods = ['auto', 'shortcut', 'manual']
    if (!validActivationMethods.includes(this.activationMethod)) {
      throw new Error(`activationMethod must be one of: ${validActivationMethods.join(', ')}`)
    }

    if (!this._isValidKeyboardShortcut(this.keyboardShortcut)) {
      throw new Error('keyboardShortcut must be a valid key combination')
    }

    if (typeof this.autoActivateMinWords !== 'number' ||
        this.autoActivateMinWords < 1 ||
        this.autoActivateMinWords > 100) {
      throw new Error('autoActivateMinWords must be a positive integer between 1 and 100')
    }

    const validTones = ['formal', 'neutral', 'casual']
    if (!validTones.includes(this.preferredTone)) {
      throw new Error(`preferredTone must be one of: ${validTones.join(', ')}`)
    }

    if (typeof this.showChangeDetails !== 'boolean') {
      throw new Error('showChangeDetails must be a boolean')
    }

    if (!Array.isArray(this.enabledDomains)) {
      throw new Error('enabledDomains must be an array')
    }

    if (!Array.isArray(this.disabledDomains)) {
      throw new Error('disabledDomains must be an array')
    }

    // Validate domain patterns
    this.enabledDomains.forEach(domain => {
      if (!this._isValidDomainPattern(domain)) {
        throw new Error(`Invalid domain pattern in enabledDomains: ${domain}`)
      }
    })

    this.disabledDomains.forEach(domain => {
      if (!this._isValidDomainPattern(domain)) {
        throw new Error(`Invalid domain pattern in disabledDomains: ${domain}`)
      }
    })
  }

  _isValidKeyboardShortcut (shortcut) {
    if (typeof shortcut !== 'string') return false

    // Valid keyboard shortcut patterns
    const patterns = [
      /^(Ctrl|Cmd|Alt|Shift)\+[A-Z]$/,
      /^(Ctrl|Cmd|Alt|Shift)\+(Ctrl|Cmd|Alt|Shift)\+[A-Z]$/,
      /^(Ctrl|Cmd|Alt|Shift)\+(Ctrl|Cmd|Alt|Shift)\+(Ctrl|Cmd|Alt|Shift)\+[A-Z]$/
    ]

    return patterns.some(pattern => pattern.test(shortcut))
  }

  _isValidDomainPattern (domain) {
    if (typeof domain !== 'string' || domain.trim().length === 0) return false

    // Allow wildcard patterns and specific domains
    const domainPattern = /^(\*\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*$/
    const urlPattern = /^https?:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*($|\/.*)?$/

    return domainPattern.test(domain) || urlPattern.test(domain)
  }

  // Preference management methods
  updateActivationMethod (method) {
    const validMethods = ['auto', 'shortcut', 'manual']
    if (!validMethods.includes(method)) {
      throw new Error(`Invalid activation method: ${method}`)
    }
    this.activationMethod = method
    this.lastModified = new Date()
  }

  updateKeyboardShortcut (shortcut) {
    if (!this._isValidKeyboardShortcut(shortcut)) {
      throw new Error('Invalid keyboard shortcut format')
    }
    this.keyboardShortcut = shortcut
    this.lastModified = new Date()
  }

  updatePreferredTone (tone) {
    const validTones = ['formal', 'neutral', 'casual']
    if (!validTones.includes(tone)) {
      throw new Error(`Invalid tone: ${tone}`)
    }
    this.preferredTone = tone
    this.lastModified = new Date()
  }

  updateAutoActivateMinWords (minWords) {
    if (typeof minWords !== 'number' || minWords < 1 || minWords > 100) {
      throw new Error('Min words must be between 1 and 100')
    }
    this.autoActivateMinWords = minWords
    this.lastModified = new Date()
  }

  toggleChangeDetails () {
    this.showChangeDetails = !this.showChangeDetails
    this.lastModified = new Date()
  }

  // Domain management methods
  addEnabledDomain (domain) {
    if (!this._isValidDomainPattern(domain)) {
      throw new Error(`Invalid domain pattern: ${domain}`)
    }

    if (!this.enabledDomains.includes(domain)) {
      this.enabledDomains.push(domain)
      this.lastModified = new Date()
    }

    // Remove from disabled if it exists there
    this.removeDisabledDomain(domain)
  }

  removeEnabledDomain (domain) {
    const index = this.enabledDomains.indexOf(domain)
    if (index > -1) {
      this.enabledDomains.splice(index, 1)
      this.lastModified = new Date()
    }
  }

  addDisabledDomain (domain) {
    if (!this._isValidDomainPattern(domain)) {
      throw new Error(`Invalid domain pattern: ${domain}`)
    }

    if (!this.disabledDomains.includes(domain)) {
      this.disabledDomains.push(domain)
      this.lastModified = new Date()
    }

    // Remove from enabled if it exists there
    this.removeEnabledDomain(domain)
  }

  removeDisabledDomain (domain) {
    const index = this.disabledDomains.indexOf(domain)
    if (index > -1) {
      this.disabledDomains.splice(index, 1)
      this.lastModified = new Date()
    }
  }

  // Domain checking methods
  isDomainEnabled (url) {
    const domain = this._extractDomain(url)
    if (!domain) return true // Default to enabled for invalid URLs

    // Check disabled list first (takes precedence)
    if (this._matchesDomainList(domain, this.disabledDomains)) {
      return false
    }

    // If no enabled list specified, default to enabled
    if (this.enabledDomains.length === 0) {
      return true
    }

    // Check enabled list
    return this._matchesDomainList(domain, this.enabledDomains)
  }

  isDomainDisabled (url) {
    return !this.isDomainEnabled(url)
  }

  _extractDomain (url) {
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return new URL(url).hostname
      } else if (url.includes('.')) {
        return url.split('/')[0] // Simple domain extraction
      }
      return url
    } catch (error) {
      return null
    }
  }

  _matchesDomainList (domain, domainList) {
    return domainList.some(pattern => {
      if (pattern.startsWith('*.')) {
        const baseDomain = pattern.substring(2)
        return domain.endsWith(baseDomain)
      } else if (pattern.startsWith('http')) {
        const patternDomain = this._extractDomain(pattern)
        return domain === patternDomain
      } else {
        return domain === pattern
      }
    })
  }

  // Activation logic methods
  shouldAutoActivate (textLength, wordCount) {
    if (this.activationMethod !== 'auto') {
      return false
    }

    return wordCount >= this.autoActivateMinWords
  }

  isShortcutActivation () {
    return this.activationMethod === 'shortcut'
  }

  isManualActivation () {
    return this.activationMethod === 'manual'
  }

  // AI parameter mapping
  getAIParameters () {
    const toneMapping = {
      formal: 'more-formal',
      neutral: 'as-is',
      casual: 'more-casual'
    }

    return {
      tone: toneMapping[this.preferredTone] || 'as-is',
      format: 'plain-text',
      length: 'as-is'
    }
  }

  // Serialization methods
  toJSON () {
    return {
      activationMethod: this.activationMethod,
      keyboardShortcut: this.keyboardShortcut,
      autoActivateMinWords: this.autoActivateMinWords,
      preferredTone: this.preferredTone,
      showChangeDetails: this.showChangeDetails,
      enabledDomains: [...this.enabledDomains],
      disabledDomains: [...this.disabledDomains],
      lastModified: this.lastModified.toISOString()
    }
  }

  static fromJSON (data) {
    const preferences = new UserPreferences({
      activationMethod: data.activationMethod,
      keyboardShortcut: data.keyboardShortcut,
      autoActivateMinWords: data.autoActivateMinWords,
      preferredTone: data.preferredTone,
      showChangeDetails: data.showChangeDetails,
      enabledDomains: data.enabledDomains || [],
      disabledDomains: data.disabledDomains || []
    })

    preferences.lastModified = new Date(data.lastModified)
    return preferences
  }

  // Storage integration methods
  async saveToStorage () {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ userPreferences: this.toJSON() })
    }
  }

  static async loadFromStorage () {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get('userPreferences')
      if (result.userPreferences) {
        return UserPreferences.fromJSON(result.userPreferences)
      }
    }
    return new UserPreferences() // Return defaults if none saved
  }

  // Factory methods for common configurations
  static createMinimalist () {
    return new UserPreferences({
      activationMethod: 'shortcut',
      showChangeDetails: false,
      autoActivateMinWords: 10
    })
  }

  static createPowerUser () {
    return new UserPreferences({
      activationMethod: 'auto',
      showChangeDetails: true,
      autoActivateMinWords: 1,
      preferredTone: 'formal'
    })
  }

  static createDefault () {
    return new UserPreferences()
  }
}

module.exports = UserPreferences
