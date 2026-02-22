import { detectIntent, VoiceIntent } from "./intents";
import { buildReply, kannadaPhrases } from "./reply";

// Dispatch a custom event to notify the app
function dispatch(name: string, detail?: any) {
    window.dispatchEvent(new CustomEvent(name, detail ? { detail } : undefined));
}

// Navigate to an app tab via event
function runAction(intent: VoiceIntent) {
    switch (intent) {
        case 'weather': return dispatch('open-weather');
        case 'crop': return dispatch('open-crop');
        case 'map': return dispatch('open-map');
        case 'irrigation': return dispatch('open-irrigation');
        case 'market': return dispatch('open-market');
        case 'subsidy': return dispatch('open-subsidy');
        case 'calendar': return dispatch('open-calendar');
        case 'advisor': return dispatch('open-advisor');
        default: break;
    }
}

// Speak a reply using browser SpeechSynthesis
function speakReply(text: string, lang: string) {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.9;
    window.speechSynthesis.cancel(); // stop any ongoing speech
    window.speechSynthesis.speak(u);
}

export function startVoiceAgent(lang = "kn-IN") {
    const RecognitionClass =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

    if (!RecognitionClass) {
        console.error("[VoiceAgent] Speech Recognition not supported in this browser");
        speakReply(kannadaPhrases.didntUnderstand, lang);
        return;
    }

    const rec = new RecognitionClass();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;

    // Notify app that we are listening
    dispatch('voice:listening');
    speakReply(kannadaPhrases.listening, lang);

    rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        console.log("[VoiceAgent] Detected speech:", text);

        // Show processing state
        dispatch('voice:processing');
        speakReply(kannadaPhrases.processing, lang);

        const intent = detectIntent(text);
        console.log("[VoiceAgent] Detected intent:", intent);

        runAction(intent);

        const reply = buildReply(intent, lang);
        // Small delay so "processing" phrase finishes before action reply
        setTimeout(() => speakReply(reply, lang), 1200);
    };

    rec.onerror = (e: any) => {
        console.error("[VoiceAgent] Recognition error:", e.error);
        dispatch('voice:error', { error: e.error });
        if (e.error === 'no-speech') {
            speakReply(kannadaPhrases.sayAgain, lang);
        } else {
            speakReply(kannadaPhrases.tryAgain, lang);
        }
    };

    rec.onend = () => {
        dispatch('voice:idle');
    };

    rec.start();
}
