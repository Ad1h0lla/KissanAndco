import { VoiceIntent } from './intents';

// Full Kannada voice reply sheet for farmer app
// Simple, rural, friendly, action-oriented Kannada

const replies: Record<VoiceIntent, Record<string, string>> = {
    weather: {
        'kn-IN': 'ಹವಾಮಾನ ಮಾಹಿತಿ ತೆರೆದಿದೆ',
        'en-IN': 'Opening weather information',
        'hi-IN': 'मौसम जानकारी खुल रही है',
    },
    crop: {
        'kn-IN': 'ಬೆಳೆ ಮಾರ್ಗದರ್ಶಿ ತೆರೆದಿದೆ',
        'en-IN': 'Opening crop guide',
        'hi-IN': 'फसल मार्गदर्शिका खुल रही है',
    },
    map: {
        'kn-IN': 'ಜಮೀನು ನಕ್ಷೆ ತೋರಿಸುತ್ತಿದೆ',
        'en-IN': 'Showing land map',
        'hi-IN': 'जमीन का नक्शा दिखा रहे हैं',
    },
    irrigation: {
        'kn-IN': 'ನೀರಾವರಿ ಯೋಜನೆ ತೋರಿಸುತ್ತಿದೆ',
        'en-IN': 'Showing irrigation plan',
        'hi-IN': 'सिंचाई योजना दिखा रहे हैं',
    },
    market: {
        'kn-IN': 'ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿ ತೆರೆದಿದೆ',
        'en-IN': 'Opening market information',
        'hi-IN': 'बाजार जानकारी खुल रही है',
    },
    subsidy: {
        'kn-IN': 'ಸಹಾಯಧನ ಮಾಹಿತಿ ತೆರೆದಿದೆ',
        'en-IN': 'Opening subsidy information',
        'hi-IN': 'सब्सिडी जानकारी खुल रही है',
    },
    calendar: {
        'kn-IN': 'ಬೆಳೆ ಕ್ಯಾಲೆಂಡರ್ ತೆರೆದಿದೆ',
        'en-IN': 'Opening crop calendar',
        'hi-IN': 'फसल कैलेंडर खुल रहा है',
    },
    advisor: {
        'kn-IN': 'ಸಲಹೆ ವಿಭಾಗ ತೆರೆದಿದೆ',
        'en-IN': 'Opening advisor',
        'hi-IN': 'सलाह विभाग खुल रहा है',
    },
    unknown: {
        'kn-IN': 'ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ, ಮತ್ತೆ ಹೇಳಿ',
        'en-IN': 'I did not understand, please say again',
        'hi-IN': 'समझ नहीं आया, फिर से कहें',
    },
};

// Situational phrases for use beyond the voice agent (e.g., voice buttons in UI)
export const kannadaPhrases = {
    // Weather
    rainTomorrow: 'ನಾಳೆ ಮಳೆಯ ಸಾಧ್ಯತೆ ಇದೆ',
    heavyRain: 'ಹೆಚ್ಚು ಮಳೆ ನಿರೀಕ್ಷೆ ಇದೆ',
    noRain: 'ಮಳೆ ಸಾಧ್ಯತೆ ಕಡಿಮೆ',
    hotWeather: 'ಹೆಚ್ಚು ಬಿಸಿಲು ಇದೆ',
    coolWeather: 'ತಂಪಾದ ಹವಾಮಾನ ಇದೆ',
    windy: 'ಗಾಳಿ ಹೆಚ್ಚು ಇದೆ',

    // Crop
    goodForCrop: 'ಈ ಬೆಳೆ ಬೆಳೆಸಲು ಒಳ್ಳೆಯ ಸಮಯ',
    notSuitable: 'ಈ ಬೆಳೆ ಸೂಕ್ತವಲ್ಲ',
    tryAnotherCrop: 'ಬೇರೆ ಬೆಳೆ ಪ್ರಯತ್ನಿಸಿ',
    soilSuitable: 'ಮಣ್ಣು ಈ ಬೆಳೆಗೆ ಸೂಕ್ತ',
    soilNotSuitable: 'ಮಣ್ಣು ಸೂಕ್ತವಲ್ಲ',

    // Irrigation
    needsWater: 'ಈ ಭಾಗಕ್ಕೆ ನೀರು ಬೇಕು',
    enoughWater: 'ನೀರು ಸಾಕಷ್ಟು ಇದೆ',
    drySoil: 'ಮಣ್ಣು ಒಣವಾಗಿದೆ',
    goodMoisture: 'ತೇವಾಂಶ ಉತ್ತಮವಾಗಿದೆ',
    irrigationNeeded: 'ನೀರಾವರಿ ಮಾಡಿರಿ',

    // Map / Land
    showingZones: 'ಜಮೀನು ವಿಭಾಗ ತೋರಿಸುತ್ತಿದೆ',
    selectArea: 'ಭಾಗವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ',
    areaSelected: 'ಭಾಗ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ',
    zoneHealthy: 'ಭಾಗ ಆರೋಗ್ಯಕರವಾಗಿದೆ',
    zoneDry: 'ಭಾಗ ಒಣವಾಗಿದೆ',

    // AI Advisor
    suggestionReady: 'ಸಲಹೆ ಸಿದ್ಧವಾಗಿದೆ',
    analyzing: 'ವಿಶ್ಲೇಷಣೆ ಮಾಡುತ್ತಿದೆ',
    recommendation: 'ಈ ಬೆಳೆ ಶಿಫಾರಸು',
    betterOption: 'ಉತ್ತಮ ಆಯ್ಕೆ ಇದೆ',

    // Help / Fallback
    didntUnderstand: 'ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ',
    sayAgain: 'ಮತ್ತೆ ಹೇಳಿ',
    tryAgain: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
    listening: 'ಕೇಳುತ್ತಿದೆ',
    processing: 'ಪ್ರಕ್ರಿಯೆ ನಡೆಯುತ್ತಿದೆ',

    // Confirmations
    done: 'ಮುಗಿದಿದೆ',
    updated: 'ನವೀಕರಿಸಲಾಗಿದೆ',
    saved: 'ಉಳಿಸಲಾಗಿದೆ',
    opened: 'ತೆರೆದಿದೆ',
    ready: 'ಸಿದ್ಧವಾಗಿದೆ',
};

/**
 * Build the voice reply for a given intent and language.
 * Falls back to Kannada (kn-IN) for unsupported languages.
 */
export function buildReply(intent: VoiceIntent | string, lang: string): string {
    const intentKey = (intent as VoiceIntent) in replies ? (intent as VoiceIntent) : 'unknown';
    return (
        replies[intentKey]?.[lang] ||
        replies[intentKey]?.['kn-IN'] ||
        replies.unknown['kn-IN']
    );
}
