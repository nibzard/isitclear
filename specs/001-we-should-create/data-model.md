# Data Model: IsItClear Chrome Extension

## Core Entities

### TextContent
**Purpose**: Represents the original text content from user input fields

**Fields**:
- `originalText: string` - The user's original text content
- `fieldType: 'input' | 'textarea' | 'contenteditable'` - Type of input element
- `fieldContext: string` - CSS selector or identifier for the input field
- `timestamp: Date` - When the text was captured
- `wordCount: number` - Number of words in original text

**Validation Rules**:
- originalText must not be empty (minimum 1 character)
- originalText maximum length: 5000 characters (based on AI model limits)
- fieldType must be one of the three supported types
- fieldContext must be a valid CSS selector

**State Transitions**:
- Created → Analyzing → Analyzed → (Accepted|Rejected)

### ClarityImprovement  
**Purpose**: Represents the AI-generated improved version of text with clarity enhancements

**Fields**:
- `improvedText: string` - The AI-rewritten text for clarity
- `improvementType: 'rewriter' | 'prompt'` - Which AI API generated the improvement
- `confidenceScore: number` - AI confidence in improvement (0-1)
- `changes: ChangeDetail[]` - Specific changes made for user review
- `processingTime: number` - Time taken to generate improvement (ms)
- `apiParameters: object` - Parameters passed to AI API

**Validation Rules**:
- improvedText must not be empty
- confidenceScore must be between 0 and 1
- processingTime must be positive number
- changes array must contain at least one change

**Relationships**:
- Belongs to one TextContent (1:1 relationship)

### ChangeDetail
**Purpose**: Represents a specific change made during text improvement for user transparency

**Fields**:
- `changeType: 'word-choice' | 'sentence-structure' | 'clarity' | 'conciseness'` - Type of change made
- `originalPhrase: string` - Original text portion that was changed
- `improvedPhrase: string` - How it was improved
- `reason: string` - AI explanation for why change improves clarity
- `startPosition: number` - Character position where change starts
- `endPosition: number` - Character position where change ends

**Validation Rules**:
- changeType must be one of the defined types
- originalPhrase and improvedPhrase must not be identical
- startPosition must be less than endPosition
- positions must be valid within the original text

### UserPreferences
**Purpose**: Stores user configuration and behavior preferences

**Fields**:
- `activationMethod: 'auto' | 'shortcut' | 'manual'` - How user prefers to trigger analysis
- `keyboardShortcut: string` - Custom keyboard shortcut (if chosen)
- `autoActivateMinWords: number` - Minimum word count for auto-activation
- `preferredTone: 'formal' | 'neutral' | 'casual'` - Default tone preference
- `showChangeDetails: boolean` - Whether to show detailed change explanations
- `enabledDomains: string[]` - Websites where extension is active
- `disabledDomains: string[]` - Websites where extension is disabled

**Validation Rules**:
- activationMethod must be one of defined options
- keyboardShortcut must be valid key combination
- autoActivateMinWords must be positive integer (1-100)
- domain lists must contain valid URLs or patterns

### ExtensionState
**Purpose**: Manages current state of the extension and active sessions

**Fields**:
- `isActive: boolean` - Whether extension is currently active
- `currentField: HTMLElement | null` - Currently focused input field
- `aiSession: AISession | null` - Active AI API session
- `processingQueue: TextContent[]` - Queue of texts waiting for analysis
- `lastError: ErrorInfo | null` - Most recent error for debugging

**State Transitions**:
- Inactive → Active (user focuses on input field)
- Active → Processing (user requests analysis)
- Processing → Completed (analysis finished)
- Completed → Active (user continues editing)
- Any state → Error (on API failure)

## Data Flow

### Text Analysis Flow
1. User focuses on input field → TextContent entity created
2. User triggers analysis → ExtensionState changes to Processing
3. AI API analyzes text → ClarityImprovement entity created
4. User reviews changes → ChangeDetail entities populated
5. User accepts/rejects → TextContent state updated

### Session Management
1. Extension activation → ExtensionState initialized
2. AI API session created and stored in ExtensionState
3. Multiple TextContent entities can use same session
4. Session destroyed on page navigation or extension deactivation

## Storage Strategy

### Chrome Local Storage
- UserPreferences: Persistent across browser sessions
- ExtensionState: Session-only, cleared on tab close
- Recent improvements: Keep last 10 for undo functionality

### Memory Management
- TextContent: Keep only current and previous (for undo)
- ClarityImprovement: Clear after user decision (accept/reject)
- ChangeDetail: Clear with parent ClarityImprovement

### Data Privacy
- No text content stored permanently
- No data transmitted outside user's device
- User preferences only persistent data

## Integration Points

### Chrome Extension APIs
- `chrome.storage.local` for UserPreferences
- `chrome.tabs` for cross-tab state management
- Content script messaging for UI updates

### Chrome AI APIs
- Rewriter API for text improvement
- Prompt API for custom analysis (fallback)
- Session management for performance

### DOM Integration
- Event listeners for input field detection
- Dynamic UI overlay creation
- Text replacement without form disruption