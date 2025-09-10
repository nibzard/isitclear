// ABOUTME: Jest setup file for Chrome extension testing environment
// ABOUTME: Configures Chrome APIs mocking and global test utilities

// Mock Chrome APIs for testing
global.chrome = require('jest-chrome')

// Manually ensure chrome.runtime has the methods we need
if (!global.chrome.runtime) {
  global.chrome.runtime = {}
}

global.chrome.runtime.id = global.chrome.runtime.id || 'test-extension-id'
global.chrome.runtime.getURL = global.chrome.runtime.getURL || jest.fn((path) => `chrome-extension://test-extension-id/${path}`)
global.chrome.runtime.onMessage = global.chrome.runtime.onMessage || {
  addListener: jest.fn(),
  removeListener: jest.fn(),
  hasListener: jest.fn()
}
global.chrome.runtime.sendMessage = global.chrome.runtime.sendMessage || jest.fn()

// Reset Chrome API mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
  if (chrome && chrome.runtime) {
    chrome.runtime.id = 'test-extension-id'
    chrome.runtime.getURL = jest.fn((path) => `chrome-extension://test-extension-id/${path}`)

    // Ensure message handling APIs are available
    chrome.runtime.onMessage = chrome.runtime.onMessage || {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn()
    }
    chrome.runtime.sendMessage = chrome.runtime.sendMessage || jest.fn()
  }
})

// Helper function to create mock Chrome AI session
global.createMockAISession = (type = 'rewriter') => {
  const session = {
    destroy: jest.fn(),
    ready: Promise.resolve('ready')
  }

  if (type === 'rewriter') {
    session.rewrite = jest.fn().mockResolvedValue('Improved text for clarity.')
  } else if (type === 'prompt') {
    session.prompt = jest.fn().mockResolvedValue('Improved text for clarity.')
  }

  return session
}

// Mock Gemini Nano AI APIs
global.Rewriter = {
  create: jest.fn(() => createMockAISession('rewriter')),
  rewrite: jest.fn()
}

global.Prompt = {
  create: jest.fn(() => createMockAISession('prompt')),
  prompt: jest.fn()
}

// Mock DOM APIs commonly used in content scripts
Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: jest.fn(() => ({
    toString: jest.fn(() => 'selected text'),
    rangeCount: 1,
    getRangeAt: jest.fn(() => ({
      startOffset: 0,
      endOffset: 5
    }))
  }))
})

// Helper function to create mock input elements
global.createMockInput = (type = 'textarea', value = '') => {
  const element = document.createElement(type === 'contenteditable' ? 'div' : type)
  if (type === 'contenteditable') {
    element.contentEditable = true
    element.textContent = value
  } else {
    element.value = value
  }
  element.focus = jest.fn()
  element.blur = jest.fn()
  element.addEventListener = jest.fn()
  element.removeEventListener = jest.fn()
  return element
}

// Suppress console warnings in tests unless explicitly testing them
const originalWarn = console.warn
console.warn = (...args) => {
  if (args[0] && args[0].includes && args[0].includes('test')) {
    originalWarn(...args)
  }
}
