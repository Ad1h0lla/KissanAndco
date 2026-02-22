let audioEl: HTMLAudioElement | null = null;
let currentAbort: AbortController | null = null;
let speechSynthesisUtterance: SpeechSynthesisUtterance | null = null;

let lastError: any = null;
let available = true;
let useBrowserFallback = false;

function emit(eventName: string, detail?: any) {
  try {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  } catch (_) {}
}

function setFailure(err: any) {
  lastError = err;
  available = false;
  const payload = {
    provider: 'ElevenLabs',
    voiceId: process.env?.ELEVENLABS_VOICE_ID || 'KSsyodh37PbfWy29kPtx',
    reason: err && (err.message || err.toString ? err.toString() : String(err)),
    time: new Date().toISOString()
  };
  // structured console log for devs
  try { console.error('[VoiceError]', payload); } catch (_) {}
  emit('voice:failure', payload);
}

// Browser-based fallback using Web Speech API (SpeechSynthesis)
async function speakBrowser(text: string, lang: 'kn'|'hi'|'en' = 'kn'): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      stop();
      const synth = window.speechSynthesis;
      if (!synth) {
        reject(new Error('SpeechSynthesis not supported'));
        return;
      }
      
      speechSynthesisUtterance = new SpeechSynthesisUtterance(text);
      // Map regional languages to supported browser voices
      const langMap: Record<string, string> = {
        'kn': 'en-IN', // Kannada fallback to Indian English
        'hi': 'hi-IN', // Hindi
        'en': 'en-US', // English
        'ta': 'ta-IN'  // Tamil
      };
      speechSynthesisUtterance.lang = langMap[lang] || 'en-US';
      speechSynthesisUtterance.rate = 0.9; // slightly slower for clarity
      
      speechSynthesisUtterance.onstart = () => { emit('voice:play'); };
      speechSynthesisUtterance.onend = () => { 
        emit('voice:stop');
        speechSynthesisUtterance = null;
        resolve();
      };
      speechSynthesisUtterance.onerror = (event: any) => {
        emit('voice:stop');
        speechSynthesisUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };
      
      synth.speak(speechSynthesisUtterance);
    } catch (e) {
      emit('voice:stop');
      reject(e);
    }
  });
}

export async function speak(text: string, lang: 'kn'|'hi'|'en' = 'kn') {
  if (!available && !useBrowserFallback) {
    const err = new Error('Voice unavailable');
    setFailure(err);
    throw err;
  }

  try {
    stop();
    currentAbort = new AbortController();

    // enforce a 6s timeout for TTS provider
    const timeoutMs = 6000;
    const timeout = setTimeout(() => {
      try { currentAbort && currentAbort.abort(); } catch(_) {}
    }, timeoutMs);

    const res = await fetch('/api/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: lang }),
      signal: currentAbort.signal
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      const err = new Error(`Voice request failed: ${res.status} ${txt}`);
      setFailure(err);
      
      // Fallback to browser speech if ElevenLabs fails
      try {
        console.log('[Voice] ElevenLabs failed, attempting browser fallback...');
        useBrowserFallback = true;
        await speakBrowser(text, lang);
        return;
      } catch (browserErr) {
        console.error('[Voice] Browser fallback also failed:', browserErr);
        throw err;
      }
    }
    
    const blob = await res.blob();
    if (!blob || blob.size === 0) {
      const err = new Error('No audio returned from provider');
      setFailure(err);
      
      // Fallback to browser speech
      try {
        console.log('[Voice] Empty audio returned, attempting browser fallback...');
        useBrowserFallback = true;
        await speakBrowser(text, lang);
        return;
      } catch (browserErr) {
        console.error('[Voice] Browser fallback also failed:', browserErr);
        throw err;
      }
    }
    
    const url = URL.createObjectURL(blob);
    audioEl = new Audio(url);
    audioEl.onended = () => { URL.revokeObjectURL(url); audioEl = null; emit('voice:stop'); };
    audioEl.onpause = () => { emit('voice:stop'); };
    emit('voice:play');
    await audioEl.play();
  } catch (e) {
    // record failure and notify UI
    setFailure(e);
    emit('voice:stop');
    throw e;
  }
}

export function stop() {
  if (currentAbort) {
    try { currentAbort.abort(); } catch(_) {}
    currentAbort = null;
  }
  if (audioEl) {
    try { audioEl.pause(); audioEl.currentTime = 0; } catch(_) {}
    audioEl = null;
  }
  if (speechSynthesisUtterance) {
    try { window.speechSynthesis.cancel(); } catch(_) {}
    speechSynthesisUtterance = null;
  }
  emit('voice:stop');
}

export async function checkAvailability(): Promise<boolean> {
  try {
    // Quick sanity check: POST a very small request and expect audio back
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('/api/voice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'test', language: 'en' }), signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      // Downgrade to browser fallback only
      useBrowserFallback = true;
      return true; // browser speech is available
    }
    const blob = await res.blob();
    return !!(blob && blob.size > 0);
  } catch (e) {
    // Fallback to browser speech
    useBrowserFallback = true;
    return true;
  }
}

export async function retryAvailability(): Promise<boolean> {
  try {
    const ok = await checkAvailability();
    if (ok) {
      available = true;
      lastError = null;
      emit('voice:recovered');
    }
    return ok;
  } catch (e) {
    return false;
  }
}

export function notifyVoiceFailure(err: any) {
  setFailure(err);
}

export function isAvailable() { return available || useBrowserFallback; }

export function getLastError() { return lastError; }

export default { speak, stop, checkAvailability, retryAvailability, notifyVoiceFailure, isAvailable, getLastError };
