// Intent detection for Kannada + English farmer voice commands
// Kannada keywords are matched against spoken text from speech recognition

export type VoiceIntent =
    | 'weather' | 'crop' | 'map' | 'irrigation'
    | 'market' | 'subsidy' | 'calendar' | 'advisor'
    | 'unknown';

export function detectIntent(text: string): VoiceIntent {
    const t = text.toLowerCase();

    // Weather — ಹವಾಮಾನ / mausam / weather / rain
    if (
        t.includes('weather') || t.includes('rain') || t.includes('temperature') ||
        t.includes('ಹವಾಮಾನ') || t.includes('ಮಳೆ') || t.includes('ಬಿಸಿಲು') ||
        t.includes('ಗಾಳಿ') || t.includes('mausam') || t.includes('barish')
    ) return 'weather';

    // Crop — ಬೆಳೆ / fasal / crop / plant
    if (
        t.includes('crop') || t.includes('plant') || t.includes('seed') ||
        t.includes('ಬೆಳೆ') || t.includes('ಬೀಜ') || t.includes('ಸಸಿ') ||
        t.includes('fasal') || t.includes('beej')
    ) return 'crop';

    // Map / Land — ನಕ್ಷೆ / ಜಮೀನು / map / land / zone
    if (
        t.includes('map') || t.includes('land') || t.includes('zone') || t.includes('field') ||
        t.includes('ನಕ್ಷೆ') || t.includes('ಜಮೀನು') || t.includes('ಭಾಗ') || t.includes('vibhaga')
    ) return 'map';

    // Irrigation — ನೀರಾವರಿ / water / sprinkler / drip
    if (
        t.includes('irrigation') || t.includes('water') || t.includes('sprinkler') || t.includes('drip') ||
        t.includes('ನೀರಾವರಿ') || t.includes('ನೀರು') || t.includes('ತೇವ') || t.includes('neer')
    ) return 'irrigation';

    // Market — ಮಾರುಕಟ್ಟೆ / bazaar / market / price
    if (
        t.includes('market') || t.includes('price') || t.includes('sell') || t.includes('bazaar') ||
        t.includes('ಮಾರುಕಟ್ಟೆ') || t.includes('ಬೆಲೆ') || t.includes('ಮಾರಾಟ') || t.includes('mandi')
    ) return 'market';

    // Subsidy — ಸಹಾಯಧನ / yojana / scheme
    if (
        t.includes('subsidy') || t.includes('scheme') || t.includes('yojana') || t.includes('government') ||
        t.includes('ಸಹಾಯಧನ') || t.includes('ಯೋಜನೆ') || t.includes('ಸರ್ಕಾರ') || t.includes('sarkar')
    ) return 'subsidy';

    // Calendar — ಕ್ಯಾಲೆಂಡರ್ / schedule / season
    if (
        t.includes('calendar') || t.includes('schedule') || t.includes('season') || t.includes('date') ||
        t.includes('ಕ್ಯಾಲೆಂಡರ್') || t.includes('ಋತು') || t.includes('ದಿನಾಂಕ') || t.includes('ruthu')
    ) return 'calendar';

    // Advisor / AI — ಸಲಹೆ / suggestion / advisor / help
    if (
        t.includes('advisor') || t.includes('suggest') || t.includes('help') || t.includes('advice') ||
        t.includes('ai') || t.includes('ಸಲಹೆ') || t.includes('ಸಹಾಯ') || t.includes('salaha')
    ) return 'advisor';

    return 'unknown';
}
