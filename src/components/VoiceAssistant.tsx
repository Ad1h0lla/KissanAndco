import React, { useCallback, useEffect, useRef, useState } from 'react';
import { startListening, stopListening, isSpeechSupported, AgentState } from '../voice/voiceAgent';
import { AppLang, VoiceIntent } from '../voice/voiceCommands';

interface VoiceAssistantProps {
    lang: AppLang;
}

const STATE_COLOR: Record<AgentState, string> = {
    idle: 'bg-green-500 hover:bg-green-600',
    listening: 'bg-red-500 hover:bg-red-600',
    processing: 'bg-yellow-500 hover:bg-yellow-600',
    speaking: 'bg-blue-500 hover:bg-blue-600',
    error: 'bg-red-700 hover:bg-red-800',
};

const STATE_ICON: Record<AgentState, string> = {
    idle: '🎙️',
    listening: '🔴',
    processing: '⏳',
    speaking: '🔊',
    error: '⚠️',
};

const TOOLTIP: Record<AppLang, string> = {
    en: 'Tap and speak',
    hi: 'दबाएं और बोलें',
    kn: 'ಒತ್ತಿ ಮಾತಾಡಿ',
    ta: 'அழுத்தி பேசுங்கள்',
};

export default function VoiceAssistant({ lang }: VoiceAssistantProps) {
    const [state, setState] = useState<AgentState>('idle');
    const [transcript, setTranscript] = useState('');
    const [intent, setIntent] = useState<VoiceIntent | null>(null);
    const [showBubble, setShowBubble] = useState(false);
    const [supported] = useState(isSpeechSupported);
    const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Hide bubble automatically after 3s
    const flashBubble = useCallback((text: string) => {
        setShowBubble(true);
        setTranscript(text);
        if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
        bubbleTimer.current = setTimeout(() => setShowBubble(false), 3000);
    }, []);

    useEffect(() => () => {
        stopListening();
        if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    }, []);

    const handleClick = useCallback(async () => {
        if (state === 'listening') {
            stopListening();
            setState('idle');
            return;
        }
        if (state !== 'idle') return;

        if (!supported) {
            flashBubble('Voice not supported in this browser');
            return;
        }

        await startListening(lang, {
            onStateChange: (s) => setState(s),
            onTranscript: (t) => flashBubble(`"${t}"`),
            onIntent: (i) => setIntent(i),
        });
    }, [lang, state, supported, flashBubble]);

    const isActive = state !== 'idle';
    const colorClass = STATE_COLOR[state];

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 select-none">

            {/* Speech bubble */}
            {showBubble && transcript && (
                <div className="
          max-w-[220px] px-4 py-2 rounded-2xl rounded-br-sm
          bg-white shadow-xl border border-gray-100
          text-sm text-gray-800 font-medium
          animate-fade-in
        ">
                    {transcript}
                </div>
            )}

            {/* Tooltip */}
            {state === 'idle' && (
                <span className="text-[11px] text-gray-400 font-medium pr-1">
                    {TOOLTIP[lang]}
                </span>
            )}

            {/* State label */}
            {isActive && (
                <span className={`
          text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full
          ${state === 'listening' ? 'text-red-600 bg-red-50' :
                        state === 'speaking' ? 'text-blue-600 bg-blue-50' :
                            state === 'error' ? 'text-red-700 bg-red-50' :
                                'text-yellow-700 bg-yellow-50'}
        `}>
                    {state}
                </span>
            )}

            {/* Mic button */}
            <button
                onClick={handleClick}
                aria-label="Voice assistant"
                title={TOOLTIP[lang]}
                className={`
          relative w-16 h-16 rounded-full shadow-2xl
          flex items-center justify-center
          text-white text-2xl
          transition-all duration-200
          focus:outline-none focus:ring-4 focus:ring-white/50
          ${colorClass}
          ${isActive ? 'scale-110' : 'scale-100 hover:scale-105'}
        `}
            >
                {/* Pulse ring when listening */}
                {state === 'listening' && (
                    <>
                        <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-40" />
                        <span className="absolute inset-0 rounded-full bg-red-300 animate-ping opacity-20 delay-150" />
                    </>
                )}

                <span className="relative z-10">{STATE_ICON[state]}</span>
            </button>

            {/* Unsupported warning */}
            {!supported && (
                <span className="text-[10px] text-red-400 text-right max-w-[120px] leading-tight">
                    Voice not available in this browser
                </span>
            )}
        </div>
    );
}
