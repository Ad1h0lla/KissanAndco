import React, { useEffect, useState } from 'react';
import voiceService from '../../lib/voiceService';
import { X, ArrowRightCircle } from 'lucide-react';

export default function VoiceErrorBanner() {
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const onFail = (e: any) => {
      setDetails(e?.detail || { reason: 'Unknown' });
      setVisible(true);
    };
    const onRecover = () => {
      setVisible(false);
      setDetails(null);
    };
    window.addEventListener('voice:failure', onFail as EventListener);
    window.addEventListener('voice:recovered', onRecover as EventListener);
    return () => {
      window.removeEventListener('voice:failure', onFail as EventListener);
      window.removeEventListener('voice:recovered', onRecover as EventListener);
    };
  }, []);

  const handleRetry = async () => {
    setChecking(true);
    try {
      const ok = await voiceService.retryAvailability();
      if (!ok) {
        // keep visible and update details
        setDetails({ reason: 'Retry failed' });
      }
    } catch (e) {
      setDetails({ reason: e?.message || String(e) });
    } finally {
      setChecking(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 w-[92%] md:w-2/3 lg:w-1/2">
      <div className="flex items-center justify-between bg-yellow-500 text-black px-4 py-3 rounded-lg shadow">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold">Voice assistant unavailable</div>
          <div className="text-sm opacity-90">Connection failed. Tap retry or continue without voice.</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRetry} disabled={checking} className="inline-flex items-center gap-2 px-3 py-2 bg-black/10 rounded">
            <ArrowRightCircle size={16} />
            <span className="text-sm">{checking ? 'Checking...' : 'Retry'}</span>
          </button>
          <button onClick={() => { setVisible(false); }} className="p-2 rounded">
            <X size={16} />
          </button>
        </div>
      </div>
      {/* Dev details */}
      <div className="mt-2 text-xs text-gray-700 bg-white/90 p-2 rounded shadow-inner">
        <div><strong>Reason:</strong> {details?.reason || 'Unknown'}</div>
        <div className="mt-1 text-[11px] text-gray-600">Console shows structured [VoiceError] entries for debugging.</div>
      </div>
    </div>
  );
}
