import React from 'react';
import { Megaphone } from 'lucide-react';
import voiceService from '../../lib/voiceService';
import { t } from '../../i18n';

type VoiceButtonProps = {
  text?: string;
  lang?: 'kn'|'hi'|'en';
  className?: string;
};

export default function VoiceButton({ text, lang = 'kn', className = '' }: VoiceButtonProps) {
  const handlePlay = async () => {
    try {
      await voiceService.speak(text || t(lang, 'greeting'), lang);
    } catch (e) {
      console.error('Voice play failed', e);
    }
  };

  return (
    <button onClick={handlePlay} aria-label="Play voice" className={`inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg ${className}`}>
      <Megaphone size={14} />
      <span className="text-sm font-medium">{t(lang, 'listen')}</span>
    </button>
  );
}
