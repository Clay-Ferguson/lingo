# Lingo - AI Coding Agent Instructions

## Project Overview
Lingo is a single-page web application for text-to-speech (TTS) and speech recognition functionality. The entire application is contained in a single HTML file (`lingo.html`) with embedded CSS and JavaScript, following a self-contained architecture pattern.

## Architecture & Key Components

### Single-File Design Pattern
- **Everything in `lingo.html`**: CSS, JavaScript, and HTML are all embedded in one file for maximum portability
- **No build process**: Direct browser execution without bundlers or compilation steps
- **Minimal dependencies**: Uses only native Web APIs (Web Speech API, SpeechSynthesis)

### Core Functionality Areas
1. **TTS Engine** (`speakText()` function): Handles voice synthesis with voice selection and rate control
2. **Speech Recognition** (`toggleSpeechRecognition()`): Continuous dictation with auto-restart capability
3. **UI State Management**: Status updates, button states, and visual feedback for active operations
4. **Persistent Settings**: localStorage for voice and rate preferences across sessions

## Development Workflow

### Local Development
```bash
./run.sh  # Starts Python HTTP server on port 8009 and opens browser
```
- Uses Python's built-in HTTP server (no Node.js/npm required)
- Opens `http://localhost:8009/lingo.html` automatically
- Server runs on port 8009 to avoid common port conflicts

### Browser Compatibility Requirements
- **Chrome/Chromium**: Full functionality (TTS + Speech Recognition)
- **Firefox/Safari**: TTS only (Speech Recognition uses webkit-specific APIs)
- **Feature Detection**: Code gracefully degrades with `supportsSpeech()` and `supportsSpeechRecognition()`

## Code Patterns & Conventions

### Error Handling Strategy
- **Graceful Degradation**: Features disable with user-friendly messages rather than throwing errors
- **Async Speech Operations**: 100ms delays for speech synthesis cancel/restart operations
- **Recognition Auto-Recovery**: Automatic restart on speech recognition end events

### State Management
- **Global Variables**: `isTTSSpeaking`, `isListening`, `shouldKeepListening` for operation states
- **DOM-Driven UI**: Button text/classes change based on current operation state
- **localStorage Keys**: Use versioned keys (`_v1` suffix) for settings migration

### Event Handling Patterns
```javascript
// Keyboard shortcuts bound to textarea with preventDefault()
if ((evt.ctrlKey || evt.metaKey) && evt.key === "Enter") // TTS trigger
if (evt.key === "Escape") // Stop all operations
if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === "m") // Toggle mic
```

### CSS Architecture
- **CSS Custom Properties**: All colors/spacing defined in `:root` for easy theming
- **Mobile-First Responsive**: `@media (max-width: 640px)` breakpoint for layout changes
- **Dark Theme Default**: Built-in dark theme optimized for accessibility

## Key Integration Points

### Web Speech API Dependencies
- **Voice Loading**: Async voice population with fallback retry logic
- **Cross-Browser Speech**: webkit-prefixed APIs for recognition, standard APIs for synthesis
- **Error Recovery**: Temporary utterances to force voice loading in some browsers

### Browser Storage
- Voice preferences persist across sessions using `STORAGE_VOICE_KEY`/`STORAGE_RATE_KEY`
- Settings save automatically on change, no explicit save action required

## Debugging & Development Aids
- **Console Helpers**: `window.__tts.speakNow(text)` and `window.__tts.cancel()` for testing
- **Status Display**: Real-time operation feedback in the UI status bar
- **Error Logging**: Console.error for speech API failures with context

## Common Modification Patterns
- **Adding Features**: Extend the single HTML file with new script sections
- **Styling Changes**: Modify CSS custom properties in `:root` for theme adjustments
- **Keyboard Shortcuts**: Add to the textarea keydown event handler with preventDefault()
- **API Integration**: Use fetch() calls within the existing JavaScript structure
