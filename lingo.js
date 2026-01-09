const readBtn = document.getElementById("readBtn");
const stopBtn = document.getElementById("stopBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const micBtn = document.getElementById("micBtn");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");
const voiceSelect = document.getElementById("voiceSelect");
const rateSelect = document.getElementById("rateSelect");
const textArea = document.getElementById("text");
const status = document.getElementById("status");

const STORAGE_VOICE_KEY = "tts_selected_voice_name_v1";
const STORAGE_RATE_KEY = "tts_selected_rate_v1";
const STORAGE_TEXT_KEY = "tts_text_buffer_v1";

let currentUtterance = null;
let isTTSSpeaking = false;
let isTTSPaused = false;

// Paragraph queue for chunked TTS reading
let paragraphQueue = [];

// Speech Recognition variables
let recognition = null;
let isListening = false;
let shouldKeepListening = false;

function supportsSpeech() {
  return "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

function supportsSpeechRecognition() {
  return "webkitSpeechRecognition" in window;
}

function setStatus(text) {
  status.textContent = text || "";
}

function updateReadButton() {
  if (isTTSSpeaking) {
    readBtn.style.display = "none";
    stopBtn.style.display = "";
    if (isTTSPaused) {
      pauseBtn.style.display = "none";
      resumeBtn.style.display = "";
    } else {
      pauseBtn.style.display = "";
      resumeBtn.style.display = "none";
    }
  } else {
    readBtn.style.display = "";
    stopBtn.style.display = "none";
    pauseBtn.style.display = "none";
    resumeBtn.style.display = "none";
    // Disable read button when speech recognition is active
    readBtn.disabled = shouldKeepListening;
  }
}

function updateMicButton() {
  if (shouldKeepListening) {
    micBtn.classList.add('listening');
    micBtn.textContent = '⏹️ Stop';
    micBtn.disabled = false;
  } else {
    micBtn.classList.remove('listening');
    micBtn.textContent = '🎤 Mic';
    // Disable mic button when TTS is speaking
    micBtn.disabled = isTTSSpeaking;
  }
}

function populateVoices() {
  const voices = window.speechSynthesis.getVoices() || [];
  
  // If no voices available yet, try again later
  if (voices.length === 0) {
    setTimeout(populateVoices, 100);
    return;
  }

  voiceSelect.innerHTML = "";

  voices.forEach((v, i) => {
    const option = document.createElement("option");
    option.value = v.name;
    option.textContent = `${v.name} (${v.lang})${v.default ? " — default" : ""}`;
    option.dataset.lang = v.lang;
    voiceSelect.appendChild(option);
  });

  // restore saved voice if present
  const saved = localStorage.getItem(STORAGE_VOICE_KEY);
  if (saved) {
    const found = Array.from(voiceSelect.options).find(o => o.value === saved);
    if (found) {
      voiceSelect.value = saved;
    }
  }

  // If nothing selected, pick the default voice or first
  if (!voiceSelect.value && voiceSelect.options.length) {
    const defaultIndex = Array.from(voiceSelect.options).findIndex(o => o.textContent.includes("— default"));
    voiceSelect.selectedIndex = defaultIndex >= 0 ? defaultIndex : 0;
  }

  // restore rate
  const savedRate = localStorage.getItem(STORAGE_RATE_KEY);
  if (savedRate) {
    rateSelect.value = savedRate;
  }
}

function savePreferences() {
  try {
    localStorage.setItem(STORAGE_VOICE_KEY, voiceSelect.value);
    localStorage.setItem(STORAGE_RATE_KEY, rateSelect.value);
  } catch (e) {
    // ignore storage errors
  }
}

function speakText(text) {
  if (!text || !text.trim()) {
    setStatus("Nothing to read");
    return;
  }

  if (!supportsSpeech()) {
    setStatus("Browser does not support the Web Speech API.");
    return;
  }

  // Stop speech recognition if it's active
  if (shouldKeepListening) {
    shouldKeepListening = false;
    if (recognition) {
      try {
        recognition.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
    // Update mic button state immediately
    isListening = false;
    micBtn.classList.remove('listening');
    micBtn.textContent = '🎤 Mic';
    textArea.classList.remove('listening-textarea');
    updateMicButton();
  }

  // Cancel any current speech and clear the queue
  window.speechSynthesis.cancel();
  paragraphQueue = [];

  // Split text into chunks that the speech API can handle
  // First split on paragraph breaks (double newlines or more)
  // Then split long paragraphs into sentences
  const MAX_CHUNK_LENGTH = 200; // Characters - keep chunks small for reliability
  
  const rawParagraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  // If no paragraph breaks found, treat the whole text as one paragraph
  const paragraphs = rawParagraphs.length > 0 ? rawParagraphs : [text];
  
  // Further split long paragraphs into sentences
  const chunks = [];
  for (const para of paragraphs) {
    const trimmed = para.trim().replace(/\n/g, ' '); // Replace single newlines with spaces
    
    if (trimmed.length <= MAX_CHUNK_LENGTH) {
      chunks.push(trimmed);
    } else {
      // Split on sentence boundaries (., !, ?)
      // Keep the punctuation with the sentence
      const sentences = trimmed.match(/[^.!?]+[.!?]+\s*/g) || [trimmed];
      
      let currentChunk = '';
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (currentChunk.length + trimmedSentence.length <= MAX_CHUNK_LENGTH) {
          currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
        } else {
          if (currentChunk) {
            chunks.push(currentChunk);
          }
          // If a single sentence is too long, just add it anyway
          currentChunk = trimmedSentence;
        }
      }
      if (currentChunk) {
        chunks.push(currentChunk);
      }
    }
  }
  
  if (chunks.length === 0) {
    setStatus("Nothing to read");
    return;
  }

  // Populate the queue
  paragraphQueue = chunks;

  // Wait a moment for cancel to complete, then start reading
  setTimeout(() => {
    speakNextParagraph();
  }, 100);
}

function speakNextParagraph() {
  // If queue is empty, we're done
  if (paragraphQueue.length === 0) {
    currentUtterance = null;
    isTTSSpeaking = false;
    isTTSPaused = false;
    setStatus("Done");
    updateReadButton();
    updateMicButton();
    return;
  }

  const voices = window.speechSynthesis.getVoices() || [];

  // If no voices available, try to trigger voice loading
  if (voices.length === 0) {
    // Force voice loading by speaking empty text first
    const tempUtter = new SpeechSynthesisUtterance("");
    window.speechSynthesis.speak(tempUtter);
    window.speechSynthesis.cancel();
    
    // Retry after a moment
    setTimeout(() => speakNextParagraph(), 200);
    return;
  }

  // Get the first paragraph from the queue
  const paragraphText = paragraphQueue[0].trim();

  const utter = new SpeechSynthesisUtterance(paragraphText);

  // prefer exact match by name; fallback to currently selected index
  const chosenName = voiceSelect.value;
  const chosenVoice = voices.find(v => v.name === chosenName) || voices[voiceSelect.selectedIndex] || null;
  if (chosenVoice) {
    utter.voice = chosenVoice;
  }

  utter.rate = parseFloat(rateSelect.value) || 1.0;
  utter.pitch = 1.0;
  utter.volume = 1.0;

  utter.onstart = () => {
    currentUtterance = utter;
    isTTSSpeaking = true;
    const remaining = paragraphQueue.length;
    setStatus(`Speaking... (${remaining} paragraph${remaining > 1 ? 's' : ''} remaining)`);
    updateReadButton();
    updateMicButton();
  };

  utter.onend = () => {
    // Remove the paragraph we just finished reading
    paragraphQueue.shift();
    
    // Continue with the next paragraph
    speakNextParagraph();
  };

  utter.onerror = (evt) => {
    console.error("Speech error:", evt);
    
    // "interrupted" errors can happen during normal cancel operations
    // or when Chrome's speech synthesis times out - try to continue
    if (evt.error === 'interrupted' && paragraphQueue.length > 0) {
      // Remove the current chunk and try the next one
      paragraphQueue.shift();
      if (paragraphQueue.length > 0) {
        setStatus("Resuming after interruption...");
        setTimeout(() => speakNextParagraph(), 100);
        return;
      }
    }
    
    // On other errors, clear everything
    paragraphQueue = [];
    currentUtterance = null;
    isTTSSpeaking = false;
    isTTSPaused = false;
    setStatus("Error during speech: " + (evt.error || "Unknown error"));
    updateReadButton();
    updateMicButton();
  };

  try {
    window.speechSynthesis.speak(utter);
  } catch (e) {
    setStatus("Error: " + e.message);
    console.error("Speech synthesis error:", e);
    paragraphQueue = [];
    isTTSSpeaking = false;
    updateReadButton();
    updateMicButton();
  }
}

// event handlers
readBtn.addEventListener("click", () => {
  // Start TTS
  const selStart = textArea.selectionStart ?? 0;
  const selEnd = textArea.selectionEnd ?? 0;
  
  let textToRead;
  if (selEnd > selStart) {
    // If there's a selection, read only the selected text
    textToRead = textArea.value.substring(selStart, selEnd);
  } else {
    // Otherwise, read from cursor position to the end
    textToRead = textArea.value.substring(selStart);
    // If at the very end (nothing to read), start from the beginning
    if (!textToRead.length) {
      textToRead = textArea.value;
    }
  }
  speakText(textToRead);
});

stopBtn.addEventListener("click", () => {
  // Stop TTS and clear the queue
  if (supportsSpeech()) {
    window.speechSynthesis.cancel();
    setStatus("Stopped");
  }
  paragraphQueue = [];
  currentUtterance = null;
  isTTSSpeaking = false;
  isTTSPaused = false;
  updateReadButton();
  updateMicButton();
});

pauseBtn.addEventListener("click", () => {
  if (supportsSpeech() && isTTSSpeaking && !isTTSPaused) {
    window.speechSynthesis.pause();
    isTTSPaused = true;
    setStatus("Paused");
    updateReadButton();
  }
});

resumeBtn.addEventListener("click", () => {
  if (supportsSpeech() && isTTSSpeaking && isTTSPaused) {
    window.speechSynthesis.resume();
    isTTSPaused = false;
    setStatus("Speaking...");
    updateReadButton();
  }
});

voiceSelect.addEventListener("change", () => {
  savePreferences();
});

rateSelect.addEventListener("change", () => {
  savePreferences();
});

// Speech Recognition Functions
function initializeSpeechRecognition() {
  if (!supportsSpeechRecognition()) {
    console.warn('Speech recognition not supported in this browser');
    micBtn.disabled = true;
    micBtn.title = "Speech recognition not supported in this browser";
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add('listening');
    micBtn.textContent = '⏹️ Stop';
    textArea.classList.add('listening-textarea');
    setStatus("Listening...");
    updateReadButton();
    updateMicButton();
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    setStatus(`Speech error: ${event.error}`);
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('listening');
    micBtn.textContent = '🎤 Mic';
    textArea.classList.remove('listening-textarea');
    
    if (shouldKeepListening) {
      // Auto-restart if we should keep listening
      try {
        recognition.start();
      } catch (error) {
        console.error('Error restarting speech recognition:', error);
        shouldKeepListening = false;
        setStatus("Speech recognition stopped");
        updateReadButton();
        updateMicButton();
      }
    } else {
      setStatus("Speech recognition stopped");
      updateReadButton();
      updateMicButton();
    }
  };

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        const transcript = event.results[i][0].transcript.trim();
        
        if (transcript) {
          insertTextAtCursor(transcript + ' ');
        }
      }
    }
  };
}

function insertTextAtCursor(text) {
  const cursorPosition = textArea.selectionStart;
  const selectionEnd = textArea.selectionEnd;
  const currentContent = textArea.value;
  
  // Insert text at cursor position, replacing any selected text
  const beforeCursor = currentContent.substring(0, cursorPosition);
  const afterCursor = currentContent.substring(selectionEnd);
  
  const newContent = beforeCursor + text + afterCursor;
  textArea.value = newContent;
  
  // Set cursor position after the inserted text
  const newCursorPosition = cursorPosition + text.length;
  textArea.setSelectionRange(newCursorPosition, newCursorPosition);
  textArea.focus();
}

function toggleSpeechRecognition() {
  if (!supportsSpeechRecognition()) {
    setStatus("Speech recognition is not supported in this browser. Please use Google Chrome.");
    return;
  }

  if (!recognition) {
    initializeSpeechRecognition();
    if (!recognition) return;
  }

  if (shouldKeepListening) {
    // Stop listening
    shouldKeepListening = false;
    try {
      recognition.stop();
      // Save text immediately when stopping voice input
      saveTextToStorage();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  } else {
    // Stop TTS if it's active before starting speech recognition
    if (isTTSSpeaking) {
      if (supportsSpeech()) {
        window.speechSynthesis.cancel();
      }
      currentUtterance = null;
      isTTSSpeaking = false;
      updateReadButton();
      updateMicButton();
    }

    // Start listening
    shouldKeepListening = true;
    try {
      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      shouldKeepListening = false;
      setStatus(`Error starting speech recognition: ${error.message}`);
    }
  }
}

// Speech Recognition button event
micBtn.addEventListener("click", toggleSpeechRecognition);

// Copy button event
copyBtn.addEventListener("click", async () => {
  const text = textArea.value;
  if (!text || !text.trim()) {
    setStatus("Nothing to copy");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    setStatus("Copied to clipboard!");
    setTimeout(() => setStatus("Ready"), 2000);
  } catch (error) {
    console.error('Copy failed:', error);
    setStatus("Failed to copy to clipboard");
    setTimeout(() => setStatus("Ready"), 2000);
  }
});

// Function to save text to storage
function saveTextToStorage() {
  try {
    let textToSave = textArea.value;
    // Add divider prefix if text exists and doesn't already start with one
    if (textToSave.trim() && !textToSave.trim().startsWith('---')) {
      textToSave = '\n---\n' + textToSave;
    }
    localStorage.setItem(STORAGE_TEXT_KEY, textToSave);
  } catch (e) {
    console.error('Error saving text buffer:', e);
  }
}

// Clear button event
clearBtn.addEventListener("click", () => {
  textArea.value = "";
  textArea.focus();
  setStatus("Text cleared");
  setTimeout(() => setStatus("Ready"), 2000);
});

// Save text buffer when page is about to close
window.addEventListener("beforeunload", () => {
  saveTextToStorage();
});

// keyboard shortcuts while textarea focused
textArea.addEventListener("keydown", (evt) => {
  if ((evt.ctrlKey || evt.metaKey) && evt.key === "Enter") {
    evt.preventDefault();
    readBtn.click();
    return;
  }
  if (evt.key === "Escape") {
    evt.preventDefault();
    if (shouldKeepListening) {
      micBtn.click(); // Stop speech recognition first
    } else if (isTTSSpeaking) {
      stopBtn.click(); // Stop TTS
    }
    return;
  }
  if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === "m") {
    evt.preventDefault();
    micBtn.click();
    return;
  }
});

// initial setup
if (!supportsSpeech()) {
  setStatus("Web Speech API not supported in this browser. Use Chrome/Chromium for best results.");
  readBtn.disabled = true;
} else {
  setStatus("Loading voices...");
  // populate voices (some browsers require async wait)
  populateVoices();
  // Many browsers fire an event when voices change
  window.speechSynthesis.onvoiceschanged = () => {
    populateVoices();
    setStatus("Ready");
  };
  // call again after a short delay in case voices arrive
  setTimeout(() => {
    populateVoices();
    setStatus("Ready");
  }, 250);
}

// Initialize speech recognition
initializeSpeechRecognition();

// Restore saved text buffer on page load
try {
  const savedText = localStorage.getItem(STORAGE_TEXT_KEY);
  if (savedText) {
    textArea.value = savedText;
  }
} catch (e) {
  console.error('Error restoring text buffer:', e);
}
  // After a short delay, ensure focus and cursor position again
// (in case browser stole focus during page load)
setTimeout(() => {
  textArea.focus();
}, 1000);

// After a short delay, ensure focus and cursor position again
// (in case browser stole focus during page load)
setTimeout(() => {
  textArea.setSelectionRange(0, 0);
}, 1200);

// Check URL parameter to auto-start mic dictation
// Use a delay to ensure speech recognition is fully initialized
function checkAutoMicStart() {
  const urlParams = new URLSearchParams(window.location.search);
  const micParam = urlParams.get('mic');
  if (micParam && micParam.toLowerCase() === 'on') {
    // Start mic dictation if not already listening and recognition is available
    if (!shouldKeepListening && supportsSpeechRecognition()) {
      toggleSpeechRecognition();
    }
  }
}

// Delay auto-mic start to ensure speech engine is initialized
setTimeout(checkAutoMicStart, 1000);

// Expose some helpers to console for debugging if needed (handy during development)
window.__tts = {
  speakNow: (txt) => speakText(String(txt)),
  cancel: () => { if (supportsSpeech()) window.speechSynthesis.cancel(); }
};
