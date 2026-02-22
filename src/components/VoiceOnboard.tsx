import React, { useEffect, useState } from 'react';
import voiceService from '../lib/voiceService';
import { t } from '../i18n';

type Props = {
  onComplete: (data: any) => void;
  language?: 'kn' | 'hi' | 'en';
};

export const VoiceOnboard: React.FC<Props> = ({ onComplete, language = 'kn' }) => {
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState('');
  const [area, setArea] = useState('');
  const [crop, setCrop] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Speak greeting on mount
    voiceService.speak(t(language, 'greeting'), language as 'kn' | 'hi' | 'en').catch(() => {});
    return () => { voiceService.stop(); };
  }, []);

  const speakPrompt = (key: string) => {
    voiceService.speak(t(language, key), language as 'kn' | 'hi' | 'en').catch(() => {});
  };

  const next = () => setStep(s => Math.min(3, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));

  const handleConfirm = async () => {
    setBusy(true);
    const data = {
      name: `${location || 'My Farm'}`,
      location: location || '',
      latitude: undefined,
      longitude: undefined,
      area: Number(area) || 1,
      irrigationType: 'Drip',
      zones: [
        { id: 1, name: 'Zone A', area: Number(area) || 1, crop: crop || 'Mixed', status: 'Planted' }
      ]
    };
    try {
      voiceService.speak(t(language, 'creating'), language as 'kn' | 'hi' | 'en').catch(() => {});
    } catch (_) {}
    await onComplete(data);
    try {
      voiceService.speak(t(language, 'created'), language as 'kn' | 'hi' | 'en').catch(() => {});
    } catch (_) {}
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">{t(language, 'greeting')}</h2>

        <div className="space-y-6">
          {step === 0 && (
            <div>
              <p className="mb-3 text-lg">{t(language, 'ask_location')}</p>
              <div className="flex gap-3">
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="ಗ್ರಾಮ, ಜಿಲ್ಲೆ" className="flex-1 p-3 rounded-lg border text-lg" />
                <button onClick={() => speakPrompt('ask_location')} className="px-4 rounded-lg bg-green-600 text-white">{t(language, 'listen')}</button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="mb-3 text-lg">{t(language, 'ask_area')}</p>
              <div className="flex gap-3">
                <input value={area} onChange={e => setArea(e.target.value)} placeholder="ಉದಾ: 2" className="flex-1 p-3 rounded-lg border text-lg" />
                <button onClick={() => speakPrompt('ask_area')} className="px-4 rounded-lg bg-green-600 text-white">{t(language, 'listen')}</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="mb-3 text-lg">{t(language, 'ask_crop')}</p>
              <div className="flex gap-3">
                <input value={crop} onChange={e => setCrop(e.target.value)} placeholder="ಉದಾ: ಜೋಳ" className="flex-1 p-3 rounded-lg border text-lg" />
                <button onClick={() => speakPrompt('ask_crop')} className="px-4 rounded-lg bg-green-600 text-white">{t(language, 'listen')}</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="mb-3 text-lg font-medium">{t(language, 'confirm')}</p>
              <div className="text-left bg-green-50 p-4 rounded-lg">
                <div className="mb-2"><strong>ಸ್ಥಳ:</strong> {location || '—'}</div>
                <div className="mb-2"><strong>ಗಾತ್ರ:</strong> {area || '—'} ಎಕರೆ</div>
                <div className="mb-2"><strong>ಬೆಳೆ:</strong> {crop || '—'}</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <div>
            {step > 0 && <button onClick={back} className="px-4 py-3 bg-gray-200 rounded-lg mr-2">{t(language, 'back')}</button>}
            {step < 3 && <button onClick={next} className="px-4 py-3 bg-green-600 text-white rounded-lg">{t(language, 'next')}</button>}
            {step === 3 && <button onClick={handleConfirm} disabled={busy} className="px-6 py-3 bg-green-700 text-white rounded-lg">{busy ? t(language, 'creating') : t(language, 'confirm_btn')}</button>}
          </div>
          <div>
            <button onClick={() => speakPrompt(step === 0 ? 'ask_location' : step === 1 ? 'ask_area' : step === 2 ? 'ask_crop' : 'confirm')} className="px-4 py-3 bg-yellow-500 text-white rounded-lg">{t(language, 'listen')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceOnboard;
