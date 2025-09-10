# IsItClear Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-09

## Active Technologies
- JavaScript ES2022, Chrome Extension Manifest V3
- Chrome Rewriter API, Chrome Prompt API, Chrome Extensions API
- Jest for unit tests, Chrome extension testing framework for integration tests
- Chrome 138+ target platform

## Project Structure
```
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

manifest.json
```

## Commands
- `npm test` - Run Jest unit tests
- `npm run test:integration` - Run Chrome extension integration tests
- `npm run build` - Build extension for production
- `npm run dev` - Development mode with hot reload
- `chrome://extensions/` - Load unpacked extension for testing

## Code Style
- JavaScript ES2022 with modern async/await patterns
- Use Chrome Extension APIs directly (no wrapper classes)
- Single data model approach (text content and improvements)
- Library-based architecture: text-processor, input-detector, ui-components
- Structured logging with console.log for Chrome DevTools
- Follow TDD: tests before implementation

## Extension-Specific Guidelines
- Use Manifest V3 format only
- Content scripts for DOM interaction
- Background service worker for AI session management
- Local storage for user preferences only
- No external network requests (local AI only)
- Progressive enhancement for unsupported browsers

## Chrome AI API Best Practices
- Reuse AI sessions for performance
- Handle API unavailability gracefully
- Implement fallback from Rewriter to Prompt API
- Validate text length before API calls (max 5000 chars)
- Check Chrome version compatibility (138+)

## Testing Strategy
- Contract tests for Chrome API schemas
- Integration tests for extension + webpage interaction
- E2E tests for complete user workflows
- Unit tests for individual library functions
- Real Chrome instance testing (no mocking of AI APIs)

## Recent Changes
- 001-we-should-create: Added Chrome extension with Gemini Nano AI integration for text clarity improvement

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->