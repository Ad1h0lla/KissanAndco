import React, { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import voiceService from '../../lib/voiceService';
import { t } from '../../i18n';

type VoiceButtonProps = {
  text?: string;
  lang?: 'kn' | 'hi' | 'en';
  className?: string;
};

export default function VoiceButton({ text, lang = 'kn', className = '' }: VoiceButtonProps) {
  const [available, setAvailable] = useState<boolean>(voiceService.isAvailable ? voiceService.isAvailable() : true);

  useEffect(() => {
    const onFail = () => setAvailable(false);
    const onRecover = () => setAvailable(true);
    window.addEventListener('voice:failure', onFail as EventListener);
    window.addEventListener('voice:recovered', onRecover as EventListener);
    return () => {
      window.removeEventListener('voice:failure', onFail as EventListener);
      window.removeEventListener('voice:recovered', onRecover as EventListener);
    };
  }, []);

  const handlePlay = async () => {
    try {
      if (!available) return;
      await voiceService.speak(text || t(lang, 'greeting'), lang);
    } catch (e) {
      console.error('Voice play failed', e);
      // notify failure so UI can surface banner
      try { voiceService.notifyVoiceFailure(e); } catch (_) { }
    }
  };

  return (
    <button
      onClick={handlePlay}
      aria-label="Play voice"
      disabled={!available}
      title={!available ? 'Voice unavailable' : undefined}
      className={`inline-flex items-center gap-2 px-3 py-2 ${available ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'} rounded-lg transition-colors ${className}`}
    >
      <Megaphone size={14} />
      <span className="text-sm font-medium">{t(lang, 'listen')}</span>
    </button>
  );
}
