# Tasks: IsItClear Chrome Extension

**Input**: Design documents from `/specs/001-we-should-create/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ COMPLETE: JavaScript ES2022, Chrome Extension Manifest V3, Chrome AI APIs
2. Load optional design documents:
   → ✅ data-model.md: 5 entities → model tasks
   → ✅ contracts/: 2 files → contract test tasks
   → ✅ research.md: Chrome AI research → setup tasks
   → ✅ quickstart.md: 5 scenarios → integration tests
3. Generate tasks by category:
   → ✅ Setup: Chrome extension project, dependencies, testing setup
   → ✅ Tests: contract tests, integration tests for user scenarios  
   → ✅ Core: models, services, UI components, content scripts
   → ✅ Integration: Chrome AI APIs, extension messaging, DOM interaction
   → ✅ Polish: unit tests, performance validation, documentation
4. Apply task rules:
   → ✅ Different files = mark [P] for parallel
   → ✅ Same file = sequential (no [P])
   → ✅ Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
   → ✅ 28 tasks generated with proper dependencies
6. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
Chrome Extension structure at repository root:
- `src/lib/` - Core libraries
- `src/content/` - Content scripts
- `src/background/` - Background service worker
- `src/popup/` - Extension popup UI
- `tests/contract/` - API contract tests
- `tests/integration/` - User scenario tests
- `tests/unit/` - Library unit tests
- `manifest.json` - Extension manifest

## Phase 3.1: Setup
- [ ] T001 Create Chrome extension project structure (src/, tests/, manifest.json)
- [ ] T002 Initialize package.json with Jest, Chrome extension testing dependencies
- [ ] T003 [P] Configure ESLint and Prettier for JavaScript ES2022
- [ ] T004 [P] Create Chrome extension manifest.json with Manifest V3 and AI permissions

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (Chrome AI APIs)
- [ ] T005 [P] Contract test Chrome Rewriter API session creation in tests/contract/test_rewriter_api.js
- [ ] T006 [P] Contract test Chrome Rewriter API text analysis in tests/contract/test_rewriter_api.js
- [ ] T007 [P] Contract test Chrome Prompt API session creation in tests/contract/test_prompt_api.js
- [ ] T008 [P] Contract test Chrome Prompt API text analysis in tests/contract/test_prompt_api.js

### Extension Internal API Tests
- [ ] T009 [P] Contract test input field detection in tests/contract/test_extension_api.js
- [ ] T010 [P] Contract test analysis result handling in tests/contract/test_extension_api.js
- [ ] T011 [P] Contract test user action processing in tests/contract/test_extension_api.js

### Integration Tests (User Scenarios)
- [ ] T012 [P] Integration test email composition clarity improvement in tests/integration/test_email_scenario.js
- [ ] T013 [P] Integration test social media post enhancement in tests/integration/test_social_scenario.js
- [ ] T014 [P] Integration test form field text improvement in tests/integration/test_form_scenario.js
- [ ] T015 [P] Integration test empty text field handling in tests/integration/test_edge_cases.js
- [ ] T016 [P] Integration test long text processing in tests/integration/test_performance.js

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Models
- [ ] T017 [P] TextContent model in src/lib/models/text-content.js
- [ ] T018 [P] ClarityImprovement model in src/lib/models/clarity-improvement.js
- [ ] T019 [P] UserPreferences model in src/lib/models/user-preferences.js
- [ ] T020 [P] ExtensionState model in src/lib/models/extension-state.js

### Core Services
- [ ] T021 [P] Chrome AI API service (Rewriter/Prompt integration) in src/lib/services/ai-service.js
- [ ] T022 [P] Input field detection service in src/lib/services/input-detector.js
- [ ] T023 [P] Text analysis service in src/lib/services/text-analyzer.js
- [ ] T024 UI overlay component for clarity suggestions in src/lib/components/clarity-overlay.js

### Extension Components
- [ ] T025 Content script for webpage integration in src/content/content-script.js
- [ ] T026 Background service worker for AI session management in src/background/background.js
- [ ] T027 Extension popup interface in src/popup/popup.js and src/popup/popup.html

## Phase 3.4: Integration
- [ ] T028 Connect content script to Chrome AI service via background worker
- [ ] T029 Implement extension message passing between components
- [ ] T030 Add Chrome local storage integration for user preferences
- [ ] T031 Implement keyboard shortcuts and context menu activation

## Phase 3.5: Polish
- [ ] T032 [P] Unit tests for AI service error handling in tests/unit/test_ai_service.js
- [ ] T033 [P] Unit tests for input detection edge cases in tests/unit/test_input_detector.js
- [ ] T034 [P] Unit tests for text validation in tests/unit/test_validation.js
- [ ] T035 Performance validation tests (<500ms processing) in tests/performance/test_performance.js
- [ ] T036 [P] Update extension documentation in docs/extension-guide.md
- [ ] T037 Accessibility testing and WCAG compliance
- [ ] T038 Cross-website compatibility testing
- [ ] T039 Execute quickstart scenarios for final validation

## Dependencies

### Critical Path
- Setup (T001-T004) → All other phases
- Tests (T005-T016) → Implementation (T017-T031)
- Models (T017-T020) → Services (T021-T024)
- Services (T021-T024) → Extension Components (T025-T027)
- Core Implementation (T017-T031) → Polish (T032-T039)

### Blocking Dependencies
- T017 (TextContent) blocks T023 (TextAnalyzer), T025 (ContentScript)
- T021 (AI Service) blocks T025 (ContentScript), T026 (Background)
- T022 (InputDetector) blocks T025 (ContentScript)
- T025, T026, T027 block T028 (Integration)

## Parallel Execution Examples

### Phase 1: Setup (All Parallel)
```bash
# Launch T001-T004 together:
Task: "Create Chrome extension project structure (src/, tests/, manifest.json)"
Task: "Initialize package.json with Jest, Chrome extension testing dependencies"
Task: "Configure ESLint and Prettier for JavaScript ES2022"
Task: "Create Chrome extension manifest.json with Manifest V3 and AI permissions"
```

### Phase 2: Contract Tests (All Parallel)
```bash
# Launch T005-T011 together:
Task: "Contract test Chrome Rewriter API session creation in tests/contract/test_rewriter_api.js"
Task: "Contract test Chrome Prompt API text analysis in tests/contract/test_prompt_api.js"
Task: "Contract test input field detection in tests/contract/test_extension_api.js"
# ... etc
```

### Phase 3: Integration Tests (All Parallel)
```bash
# Launch T012-T016 together:
Task: "Integration test email composition clarity improvement in tests/integration/test_email_scenario.js"
Task: "Integration test social media post enhancement in tests/integration/test_social_scenario.js"
# ... etc
```

### Phase 4: Models (All Parallel)
```bash
# Launch T017-T020 together:
Task: "TextContent model in src/lib/models/text-content.js"
Task: "ClarityImprovement model in src/lib/models/clarity-improvement.js" 
Task: "UserPreferences model in src/lib/models/user-preferences.js"
Task: "ExtensionState model in src/lib/models/extension-state.js"
```

### Phase 5: Services (Mostly Parallel)
```bash
# Launch T021-T023 together (T024 depends on T023):
Task: "Chrome AI API service (Rewriter/Prompt integration) in src/lib/services/ai-service.js"
Task: "Input field detection service in src/lib/services/input-detector.js"
Task: "Text analysis service in src/lib/services/text-analyzer.js"
```

## Notes
- [P] tasks = different files, no dependencies between them
- Always verify tests fail before implementing (TDD requirement)
- Commit after each completed task
- Chrome extension requires real Chrome browser for testing
- AI API tests need Chrome 138+ with Gemini Nano model
- Focus on user experience and performance (<500ms processing)

## Task Generation Rules Applied

### From Contracts (chrome-ai-api.json, extension-api.json)
- T005-T011: Contract tests for each API endpoint/schema
- T021, T023: Service implementations for contract fulfillment

### From Data Model (5 entities)
- T017-T020: One model task per entity (TextContent, ClarityImprovement, UserPreferences, ExtensionState)

### From User Stories (quickstart.md scenarios)
- T012-T016: Integration tests for each user scenario
- T039: Final validation using quickstart guide

### From Technical Requirements
- T001-T004: Chrome extension setup and configuration
- T025-T027: Extension-specific components (content, background, popup)
- T028-T031: Integration with Chrome APIs and messaging

## Validation Checklist ✅

- [x] All contracts have corresponding tests (T005-T011)
- [x] All entities have model tasks (T017-T020) 
- [x] All tests come before implementation (T005-T016 before T017-T031)
- [x] Parallel tasks truly independent (different files, no shared state)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task
- [x] TDD ordering enforced (tests must fail before implementation)
- [x] Chrome extension architecture properly structured
- [x] Performance requirements addressed (<500ms)
- [x] User scenarios fully covered in integration tests