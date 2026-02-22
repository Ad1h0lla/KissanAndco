// ─────────────────────────────────────────────────────────────────────────────
// voiceCommands.ts — Intent detection + localized voice responses
// Supports: English (en-IN), Hindi (hi-IN), Kannada (kn-IN)
// ─────────────────────────────────────────────────────────────────────────────

export type AppLang = 'en' | 'hi' | 'kn' | 'ta';
export type RecognitionLang = 'en-IN' | 'hi-IN' | 'kn-IN' | 'ta-IN';

export type VoiceIntent =
    | 'weather'
    | 'crop'
    | 'map'
    | 'irrigation'
    | 'market'
    | 'subsidy'
    | 'calendar'
    | 'advisor'
    | 'help'
    | 'unknown';

/** Map app language code → browser recognition language */
export function toRecognitionLang(lang: AppLang): RecognitionLang {
    const map: Record<AppLang, RecognitionLang> = {
        en: 'en-IN',
        hi: 'hi-IN',
        kn: 'kn-IN',
        ta: 'ta-IN',
    };
    return map[lang] ?? 'en-IN';
}

// ─── Intent keyword tables ───────────────────────────────────────────────────

const INTENT_KEYWORDS: Record<VoiceIntent, string[]> = {
    weather: [
        // English
        'weather', 'rain', 'climate', 'temperature', 'forecast', 'humidity', 'wind',
        // Hindi
        'मौसम', 'बारिश', 'वर्षा', 'तापमान', 'जलवायु',
        // Kannada
        'ಹವಾಮಾನ', 'ಮಳೆ', 'ಬಿಸಿಲು', 'ಗಾಳಿ', 'ತಾಪಮಾನ',
        // Transliterated
        'mausam', 'barish', 'havaman',
    ],
    crop: [
        // English
        'crop', 'plant', 'seed', 'farming', 'agriculture', 'harvest', 'sow',
        // Hindi
        'खेती', 'फसल', 'बीज', 'कृषि', 'पौधा',
        // Kannada
        'ಬೆಳೆ', 'ಬೀಜ', 'ಸಸಿ', 'ಕೃಷಿ', 'ಬೆಳೆಸು',
        // Transliterated
        'fasal', 'kheti', 'bele', 'beej',
    ],
    map: [
        // English
        'map', 'land', 'field', 'zone', 'area', 'plot', 'farm',
        // Hindi
        'जमीन', 'खेत', 'नक्शा', 'भूमि', 'क्षेत्र',
        // Kannada
        'ಜಮೀನು', 'ನಕ್ಷೆ', 'ಭಾಗ', 'ಕ್ಷೇತ್ರ',
        // Transliterated
        'jameen', 'naksha', 'nakshe', 'jaminu',
    ],
    irrigation: [
        // English
        'irrigation', 'water', 'sprinkler', 'drip', 'moisture',
        // Hindi
        'सिंचाई', 'पानी', 'जल', 'नमी',
        // Kannada
        'ನೀರಾವರಿ', 'ನೀರು', 'ತೇವ', 'ಆರ್ದ್ರತೆ',
        // Transliterated
        'neeravari', 'neeru', 'pani', 'sinchai',
    ],
    market: [
        // English
        'market', 'price', 'sell', 'buy', 'trade', 'mandi',
        // Hindi
        'मंडी', 'बाजार', 'कीमत', 'बेचना', 'खरीदना',
        // Kannada
        'ಮಾರುಕಟ್ಟೆ', 'ಬೆಲೆ', 'ಮಾರಾಟ',
        // Transliterated
        'mandi', 'bazar', 'bele', 'marukatte',
    ],
    subsidy: [
        // English
        'subsidy', 'scheme', 'government', 'grant', 'benefit', 'yojana',
        // Hindi
        'सहायता', 'सब्सिडी', 'योजना', 'सरकार', 'अनुदान',
        // Kannada
        'ಸಹಾಯಧನ', 'ಯೋಜನೆ', 'ಸರ್ಕಾರ',
        // Transliterated
        'sahaydhana', 'yojane', 'sarkar',
    ],
    calendar: [
        // English
        'calendar', 'schedule', 'season', 'date', 'event', 'task',
        // Hindi
        'कैलेंडर', 'अनुसूची', 'मौसम', 'तारीख',
        // Kannada
        'ಕ್ಯಾಲೆಂಡರ್', 'ಋತು', 'ದಿನಾಂಕ',
        // Transliterated
        'calendar', 'ruthu', 'dinanka',
    ],
    advisor: [
        // English
        'advisor', 'suggest', 'advice', 'recommend', 'ai', 'consultant',
        // Hindi
        'सलाह', 'सुझाव', 'मार्गदर्शन',
        // Kannada
        'ಸಲಹೆ', 'ಮಾರ್ಗದರ್ಶಿ',
        // Transliterated
        'salaha', 'margadarshi', 'salah',
    ],
    help: [
        // English
        'help', 'support', 'assist', 'guide', 'tutorial',
        // Hindi
        'मदद', 'सहायता', 'गाइड',
        // Kannada
        'ಸಹಾಯ', 'ಮಾರ್ಗದರ್ಶಿ',
        // Transliterated
        'madad', 'sahaya',
    ],
    unknown: [],
};

/** Detect intent from spoken text. Returns first match or 'unknown'. */
export function detectIntent(text: string): VoiceIntent {
    const t = text.toLowerCase();
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
        if (intent === 'unknown') continue;
        if (keywords.some((kw) => t.includes(kw.toLowerCase()))) {
            return intent as VoiceIntent;
        }
    }
    return 'unknown';
}

// ─── Localized voice responses ────────────────────────────────────────────────

type LangReplies = Record<RecognitionLang, string>;

const REPLIES: Record<VoiceIntent | 'listening' | 'processing' | 'error_no_speech' | 'error_generic', LangReplies> = {
    // ── Navigation confirmations
    weather: {
        'en-IN': 'Opening weather information',
        'hi-IN': 'मौसम जानकारी खोल रहा हूँ',
        'kn-IN': 'ಹವಾಮಾನ ಮಾಹಿತಿ ತೆರೆದಿದೆ',
        'ta-IN': 'வானிலை தகவல் திறக்கிறேன்',
    },
    crop: {
        'en-IN': 'Opening crop guide',
        'hi-IN': 'फसल मार्गदर्शिका खोल रहा हूँ',
        'kn-IN': 'ಬೆಳೆ ಮಾರ್ಗದರ್ಶಿ ತೆರೆದಿದೆ',
        'ta-IN': 'பயிர் வழிகாட்டி திறக்கிறேன்',
    },
    map: {
        'en-IN': 'Showing land map',
        'hi-IN': 'नक्शा दिखा रहा हूँ',
        'kn-IN': 'ಜಮೀನು ನಕ್ಷೆ ತೋರಿಸುತ್ತಿದೆ',
        'ta-IN': 'நிலம் வரைபடம் காட்டுகிறேன்',
    },
    irrigation: {
        'en-IN': 'Showing irrigation plan',
        'hi-IN': 'सिंचाई योजना दिखा रहा हूँ',
        'kn-IN': 'ನೀರಾವರಿ ಯೋಜನೆ ತೋರಿಸುತ್ತಿದೆ',
        'ta-IN': 'நீர்ப்பாசன திட்டம் காட்டுகிறேன்',
    },
    market: {
        'en-IN': 'Opening market information',
        'hi-IN': 'बाजार जानकारी खोल रहा हूँ',
        'kn-IN': 'ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿ ತೆರೆದಿದೆ',
        'ta-IN': 'சந்தை தகவல் திறக்கிறேன்',
    },
    subsidy: {
        'en-IN': 'Opening subsidy schemes',
        'hi-IN': 'सहायता योजनाएं खोल रहा हूँ',
        'kn-IN': 'ಸಹಾಯಧನ ಮಾಹಿತಿ ತೆರೆದಿದೆ',
        'ta-IN': 'மானியத் திட்டங்கள் திறக்கிறேன்',
    },
    calendar: {
        'en-IN': 'Opening crop calendar',
        'hi-IN': 'फसल कैलेंडर खोल रहा हूँ',
        'kn-IN': 'ಬೆಳೆ ಕ್ಯಾಲೆಂಡರ್ ತೆರೆದಿದೆ',
        'ta-IN': 'பயிர் நாட்காட்டி திறக்கிறேன்',
    },
    advisor: {
        'en-IN': 'Opening AI advisor',
        'hi-IN': 'AI सलाहकार खोल रहा हूँ',
        'kn-IN': 'ಸಲಹೆ ವಿಭಾಗ ತೆರೆದಿದೆ',
        'ta-IN': 'AI ஆலோசகர் திறக்கிறேன்',
    },
    help: {
        'en-IN': 'Opening tutorial',
        'hi-IN': 'ट्यूटोरियल खोल रहा हूँ',
        'kn-IN': 'ಸಹಾಯ ವಿಭಾಗ ತೆರೆದಿದೆ',
        'ta-IN': 'பயிற்சி திறக்கிறேன்',
    },
    unknown: {
        'en-IN': 'I did not understand. Please say again.',
        'hi-IN': 'समझ नहीं आया। फिर से बोलिए।',
        'kn-IN': 'ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ, ಮತ್ತೆ ಹೇಳಿ',
        'ta-IN': 'புரியவில்லை, மீண்டும் சொல்லுங்கள்',
    },
    // ── Status phrases
    listening: {
        'en-IN': 'Listening',
        'hi-IN': 'सुन रहा हूँ',
        'kn-IN': 'ಕೇಳುತ್ತಿದೆ',
        'ta-IN': 'கேட்கிறேன்',
    },
    processing: {
        'en-IN': 'Processing',
        'hi-IN': 'प्रक्रिया हो रही है',
        'kn-IN': 'ಪ್ರಕ್ರಿಯೆ ನಡೆಯುತ್ತಿದೆ',
        'ta-IN': 'செயலாக்குகிறேன்',
    },
    error_no_speech: {
        'en-IN': 'No speech detected. Please try again.',
        'hi-IN': 'कोई बात नहीं सुनी। फिर से आज़माएं।',
        'kn-IN': 'ಮಾತು ಕೇಳಿಸಲಿಲ್ಲ, ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
        'ta-IN': 'பேச்சு கண்டறியவில்லை, மீண்டும் முயற்சி செய்',
    },
    error_generic: {
        'en-IN': 'Something went wrong. Please try again.',
        'hi-IN': 'कुछ गलत हुआ। फिर से आज़माएं।',
        'kn-IN': 'ತಪ್ಪಾಯಿತು, ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
        'ta-IN': 'பிழை ஏற்பட்டது, மீண்டும் முயற்சி செய்',
    },
};

/** Get localized reply string */
export function getReply(
    key: VoiceIntent | 'listening' | 'processing' | 'error_no_speech' | 'error_generic',
    lang: RecognitionLang
): string {
    return REPLIES[key]?.[lang] ?? REPLIES[key]?.['en-IN'] ?? '';
}

/** App event name for each intent */
export const INTENT_EVENT: Partial<Record<VoiceIntent, string>> = {
    weather: 'open-weather',
    crop: 'open-crop',
    map: 'open-map',
    irrigation: 'open-irrigation',
    market: 'open-market',
    subsidy: 'open-subsidy',
    calendar: 'open-calendar',
    advisor: 'open-advisor',
    help: 'open-tutorial',
};
