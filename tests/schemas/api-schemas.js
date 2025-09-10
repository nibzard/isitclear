// ABOUTME: API schemas for testing Chrome AI APIs contract validation
// ABOUTME: Defines expected request/response structures for Rewriter and Prompt APIs

const rewriterApiSchema = {
  request: {
    type: 'object',
    properties: {
      input: { type: 'string', minLength: 1 },
      context: { type: 'string' },
      length: {
        type: 'string',
        enum: ['as-is', 'shorter', 'longer']
      },
      format: {
        type: 'string',
        enum: ['as-is', 'plain-text', 'markdown']
      },
      tone: {
        type: 'string',
        enum: ['as-is', 'more-formal', 'more-casual']
      }
    },
    required: ['input'],
    additionalProperties: false
  },
  response: {
    type: 'object',
    properties: {
      output: { type: 'string' }
    },
    required: ['output'],
    additionalProperties: false
  }
}

const promptApiSchema = {
  request: {
    type: 'object',
    properties: {
      prompt: { type: 'string', minLength: 1 }
    },
    required: ['prompt'],
    additionalProperties: false
  },
  response: {
    type: 'object',
    properties: {
      output: { type: 'string' }
    },
    required: ['output'],
    additionalProperties: false
  }
}

const aiServiceSchema = {
  analyzeRequest: {
    type: 'object',
    properties: {
      text: { type: 'string', minLength: 1 },
      tone: {
        type: 'string',
        enum: ['as-is', 'more-formal', 'more-casual']
      },
      fieldType: { type: 'string' },
      fieldContext: { type: 'string' }
    },
    required: ['text'],
    additionalProperties: false
  },
  analyzeResponse: {
    type: 'object',
    properties: {
      originalText: { type: 'string' },
      improvedText: { type: 'string' },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      suggestions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            description: { type: 'string' },
            originalPhrase: { type: 'string' },
            suggestedPhrase: { type: 'string' }
          },
          required: ['type', 'description']
        }
      }
    },
    required: ['originalText', 'improvedText', 'confidence'],
    additionalProperties: false
  }
}

module.exports = {
  rewriterApiSchema,
  promptApiSchema,
  aiServiceSchema
}
