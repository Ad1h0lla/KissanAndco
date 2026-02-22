import React from 'react';
import { startVoiceAgent } from "../agent/voiceAgent";

export default function VoiceAgentButton() {
    return (
        <button
            onClick={() => startVoiceAgent("kn-IN")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors shadow-lg"
            title="Start Voice Assistant"
        >
            <span className="text-lg">🎤</span>
            <span className="font-medium text-sm">ರೈತ ಸಹಾಯಕ</span>
        </button>
    );
}
