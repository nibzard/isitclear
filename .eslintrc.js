module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
    webextensions: true,
    jest: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  globals: {
    chrome: 'readonly',
    Rewriter: 'readonly',
    Prompt: 'readonly',
    createMockInput: 'readonly',
    createMockAISession: 'readonly'
  },
  rules: {
    // Enforce consistent code style
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'never'],
    
    // Chrome extension specific
    'no-undef': 'error',
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    
    // Modern JavaScript features
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'template-curly-spacing': 'error',
    
    // Code quality
    'no-console': 'off', // Allowed for Chrome extension logging
    'camelcase': ['error', { 'properties': 'never' }],
    'max-len': ['error', { 'code': 100, 'ignoreUrls': true }],
    
    // Async/await best practices
    'require-await': 'error',
    'no-return-await': 'error',
    
    // Chrome extension security
    'no-eval': 'error',
    'no-implied-eval': 'error'
  },
  overrides: [
    {
      files: ['tests/**/*.js'],
      rules: {
        // More lenient rules for tests
        'max-len': 'off',
        'no-unused-expressions': 'off'
      }
    },
    {
      files: ['src/content/**/*.js'],
      rules: {
        // Content scripts have access to page globals
        'no-undef': 'off'
      }
    }
  ]
}