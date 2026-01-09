# Lingo 🗣️

A powerful, lightweight web application for text-to-speech (TTS) and speech recognition functionality. **No web development knowledge required** - simply download the project files and open `lingo.html` in your Chrome browser to get started! Lingo provides an intuitive interface for reading text aloud and converting speech to text, all running directly in your browser with no dependencies or build process required.

![Lingo Application Screenshot](lingo-screenshot.png)

## ✨ Features

### 🔊 Text-to-Speech (TTS)
- **Smart Reading**: Read selected text, from cursor position, or the entire document
- **Cursor Position Reading**: Place your cursor anywhere in the text to start reading from that point
- **Pause & Resume**: Pause speech at any time and resume where you left off
- **Voice Selection**: Choose from all available system voices with language indicators
- **Speed Control**: Adjustable speaking rates from slow (0.85x) to ludicrous (1.35x)
- **Persistent Settings**: Voice and speed preferences automatically saved
- **Cross-Browser Compatible**: Works in Chrome, Firefox, Safari, and other modern browsers

### 🎤 Speech Recognition
- **Continuous Dictation**: Real-time speech-to-text conversion
- **Auto-Restart**: Seamlessly continues listening after pauses
- **Smart Insertion**: Text appears at cursor position, preserving existing content
- **Visual Feedback**: Textarea highlights when actively listening
- **Chrome Optimized**: Full functionality in Chrome/Chromium browsers

### ⌨️ Keyboard Shortcuts
- **Ctrl/Cmd + Enter**: Start/stop text reading
- **Ctrl/Cmd + M**: Toggle microphone dictation
- **Escape**: Stop all active operations (TTS or speech recognition)

### 🔗 URL Parameters
- **`?mic=on`**: Automatically start mic dictation when the page loads

### 🎨 User Interface
- **Dark Theme**: Easy-on-the-eyes default dark interface
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Real-time Status**: Live feedback on current operations
- **Accessible**: Full keyboard navigation and screen reader support
- **Simple Architecture**: Clean separation of HTML, CSS, and JavaScript

## 🚀 Quick Start

### Simplest Method -- No Web Server required

The easiest way to use Lingo is to simply open the HTML file directly:

1. **Download** `lingo.html`, `lingo.css`, and `lingo.js` to the same folder on your computer
2. **Double-click** `lingo.html` or **right-click → Open with → Chrome** (or any browser that supports Web Speech APIs)
3. **Start using** - no server setup required!

> **Note**: Chrome/Chromium browsers provide the best experience with full TTS and speech recognition support.

### Running with Local Server (Recommended)

You only need to use the web server if you want to avoid repeated microphone permission prompts. Browsers require microphone permission each time when running from `file://` URLs, but remember your choice when running from `http://localhost`.

For this setup:

1. **Clone or download** the project files
2. **Run the startup script**:
   ```bash
   ./run.sh
   ```
3. **Your browser will automatically open** to `http://localhost:8009/lingo.html`

### Manual Server Setup (Alternative)

If you prefer to run it manually:

```bash
# Start a local HTTP server
python3 -m http.server 8009

# Open your browser to:
# http://localhost:8009/lingo.html
```

## 📋 How to Use

### Text-to-Speech
1. **Type or paste text** into the main textarea
2. **Drag and drop text** from other applications directly into the textarea (especially handy on Linux - simply select text from any app and drag it in)
3. **Position your cursor** where you want reading to begin, or **select specific text** to read only that portion
4. **Click "🔊 Read"** or press **Ctrl/Cmd + Enter**
5. **Choose your preferred voice** and speaking speed from the dropdowns
6. **Click "⏸️ Pause"** to pause reading, then **"▶️ Resume"** to continue from where you left off
7. **Click "⏹️ Stop"** or press **Escape** to stop reading completely

> **Tip**: If your cursor is at the very end of the text, clicking Read Aloud will start from the beginning.

### Speech Recognition
1. **Click "🎤 Mic"** or press **Ctrl/Cmd + M**
2. **Speak clearly** - your words will appear in the textarea
3. **The app continues listening** until you stop it manually
4. **Click "⏹️ Stop"** or press **Escape** to stop dictation

> **Tip**: Add `?mic=on` to the URL to automatically start mic dictation when the page loads (e.g., `http://localhost:8009/lingo.html?mic=on`).

## 🛠️ Technical Details

### Architecture
- **Three-File Structure**: Clean separation of HTML, CSS, and JavaScript
- **No Build Process**: Runs directly in browser without compilation
- **Zero Dependencies**: Uses only native Web APIs
- **Portable**: Copy `lingo.html`, `lingo.css`, and `lingo.js` to any folder and it works

### Browser Compatibility
| Browser | TTS Support | Speech Recognition |
|---------|-------------|-------------------|
| Chrome/Chromium | ✅ Full | ✅ Full |
| Firefox | ✅ Full | ❌ Not supported |
| Safari | ✅ Full | ❌ Not supported |
| Edge | ✅ Full | ✅ Full |

### Web APIs Used
- **Speech Synthesis API**: For text-to-speech functionality
- **Web Speech API**: For speech recognition (webkit-prefixed)
- **localStorage**: For persistent settings
- **File API**: For handling text input/output

## 📁 Project Structure

```
lingo/
├── lingo.html         # Main HTML structure
├── lingo.css          # Styles and theming
├── lingo.js           # Application logic
├── run.sh             # Startup script for local development
├── kill.sh            # Stop the local server
└── README.md          # This documentation
```

## 🔧 The Run Script

The `run.sh` script provides a convenient way to start the application:

### What it does:
1. **Port Management**: Checks for existing servers on port 8009 and terminates them
2. **Server Startup**: Launches Python's built-in HTTP server
3. **Browser Launch**: Automatically opens your default browser to the app
4. **Process Management**: Keeps the server running and handles graceful shutdown

### Why we need it:
- **Security**: Modern browsers require HTTPS or localhost for Web APIs
- **Cross-Origin**: Direct file access (`file://`) blocks certain features
- **Port 8009**: Chosen to avoid conflicts with common development ports

## 🎯 Use Cases

- **Content Review**: Listen to written content for proofreading
- **Accessibility**: Assist users with reading difficulties
- **Multitasking**: Consume text content while doing other activities
- **Note Taking**: Quickly dictate thoughts and ideas
- **Language Learning**: Hear proper pronunciation of text
- **Voice Memos**: Convert speech to text for documentation

## 🔍 Development Features

### Console Helpers
For testing and debugging, Lingo exposes utility functions:
```javascript
// Speak any text directly
window.__tts.speakNow("Hello world");

// Stop current speech
window.__tts.cancel();
```

### Error Handling
- **Graceful Degradation**: Features disable cleanly when unsupported
- **Auto-Recovery**: Speech recognition restarts automatically after interruptions
- **User Feedback**: Clear status messages for all operations

## 🤝 Contributing

Lingo follows a simple three-file architecture for easy maintenance. When contributing:

1. **Keep files organized** - HTML in `lingo.html`, styles in `lingo.css`, logic in `lingo.js`
2. **Test across browsers** - especially Chrome vs Firefox
3. **Maintain responsive design** - mobile and desktop compatibility
4. **Preserve accessibility** - keyboard navigation and screen readers

## 📝 License

This project is open source. Feel free to use, modify, and distribute as needed.

## 🔮 Future Enhancements

- Language detection and automatic voice matching
- Export functionality for dictated text
- Custom voice pitch and volume controls
- Batch processing for multiple text files
- Integration with cloud speech services for enhanced recognition

---

**Lingo** - Bringing voice to your text and text to your voice! 🎙️✨
