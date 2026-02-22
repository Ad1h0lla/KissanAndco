// ─────────────────────────────────────────────────────────────────────────────
// voiceAgent.ts — Core voice agent: recognise → detect intent → navigate → speak
// Uses browser Web Speech API only. No backend, no paid APIs.
// ─────────────────────────────────────────────────────────────────────────────

import {
    AppLang,
    RecognitionLang,
    VoiceIntent,
    detectIntent,
    getReply,
    toRecognitionLang,
    INTENT_EVENT,
} from './voiceCommands';

// ─── Internal state ───────────────────────────────────────────────────────────
let recognition: any = null;
let isListening = false;

// ─── Capability check ─────────────────────────────────────────────────────────
export function isSpeechSupported(): boolean {
    return !!(
        typeof window !== 'undefined' &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    );
}

// ─── Dispatch navigation events ───────────────────────────────────────────────
function navigate(intent: VoiceIntent) {
    const eventName = INTENT_EVENT[intent];
    if (eventName) {
        window.dispatchEvent(new CustomEvent(eventName));
    }
}

// ─── Browser TTS speak ────────────────────────────────────────────────────────
function speak(text: string, lang: RecognitionLang): Promise<void> {
    return new Promise((resolve) => {
        if (!window.speechSynthesis || !text) { resolve(); return; }
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        u.rate = 0.92;
        u.pitch = 1;
        u.onend = () => resolve();
        u.onerror = () => resolve(); // don't block on TTS error
        window.speechSynthesis.speak(u);
    });
}

// ─── State change callbacks ───────────────────────────────────────────────────
export type AgentState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceAgentCallbacks {
    onStateChange?: (state: AgentState) => void;
    onTranscript?: (text: string) => void;
    onIntent?: (intent: VoiceIntent) => void;
}

// ─── Main agent ───────────────────────────────────────────────────────────────
export async function startListening(
    lang: AppLang,
    callbacks: VoiceAgentCallbacks = {}
): Promise<void> {
    if (!isSpeechSupported()) {
        console.warn('[VoiceAgent] SpeechRecognition not supported in this browser.');
        return;
    }

    // Prevent duplicate sessions
    if (isListening) {
        stopListening();
        return;
    }

    const recLang: RecognitionLang = toRecognitionLang(lang);
    const { onStateChange, onTranscript, onIntent } = callbacks;

    const RecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    recognition = new RecognitionClass();
    recognition.lang = recLang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    isListening = true;
    onStateChange?.('listening');
    window.dispatchEvent(new CustomEvent('voice:listening'));

    // Speak "Listening" cue in selected language
    await speak(getReply('listening', recLang), recLang);

    recognition.onresult = async (event: any) => {
        // Collect all alternatives to improve intent detection
        const transcripts: string[] = [];
        for (let i = 0; i < event.results[0].length; i++) {
            transcripts.push(event.results[0][i].transcript);
        }
        const fullText = transcripts.join(' ');
        console.log('[VoiceAgent] Heard:', fullText);

        onStateChange?.('processing');
        onTranscript?.(fullText);
        window.dispatchEvent(new CustomEvent('voice:processing'));

        const intent = detectIntent(fullText);
        console.log('[VoiceAgent] Intent:', intent);
        onIntent?.(intent);

        onStateChange?.('speaking');
        navigate(intent);

        const reply = getReply(intent, recLang);
        await speak(reply, recLang);

        isListening = false;
        onStateChange?.('idle');
        window.dispatchEvent(new CustomEvent('voice:idle'));
    };

    recognition.onerror = async (event: any) => {
        console.error('[VoiceAgent] Error:', event.error);
        isListening = false;
        onStateChange?.('error');
        window.dispatchEvent(new CustomEvent('voice:error', { detail: event.error }));

        const key = event.error === 'no-speech' ? 'error_no_speech' : 'error_generic';
        await speak(getReply(key, recLang), recLang);
        onStateChange?.('idle');
        window.dispatchEvent(new CustomEvent('voice:idle'));
    };

    recognition.onend = () => {
        if (isListening) {
            // Ended without result (e.g., timed out)
            isListening = false;
            onStateChange?.('idle');
            window.dispatchEvent(new CustomEvent('voice:idle'));
        }
    };

    try {
        recognition.start();
    } catch (e) {
        console.error('[VoiceAgent] Failed to start recognition:', e);
        isListening = false;
        onStateChange?.('idle');
    }
}

export function stopListening() {
    if (recognition) {
        try { recognition.stop(); } catch (_) { }
        recognition = null;
    }
    if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (_) { }
    }
    isListening = false;
}

export function getIsListening(): boolean {
    return isListening;
}
