let audioEl: HTMLAudioElement | null = null;
let currentAbort: AbortController | null = null;

function emit(eventName: string) {
  try {
    window.dispatchEvent(new CustomEvent(eventName));
  } catch (_) {}
}

export async function speak(text: string, lang: 'kn'|'hi'|'en' = 'kn') {
  try {
    stop();
    currentAbort = new AbortController();
    const res = await fetch('/api/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: lang }),
      signal: currentAbort.signal
    });
    if (!res.ok) throw new Error('Voice request failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    audioEl = new Audio(url);
    audioEl.onended = () => { URL.revokeObjectURL(url); audioEl = null; emit('voice:stop'); };
    audioEl.onpause = () => { emit('voice:stop'); };
    emit('voice:play');
    await audioEl.play();
  } catch (e) {
    console.error('speak error', e);
    emit('voice:stop');
  }
}

export function stop() {
  if (currentAbort) {
    try { currentAbort.abort(); } catch(_) {}
    currentAbort = null;
  }
  if (audioEl) {
    try { audioEl.pause(); audioEl.currentTime = 0; } catch(_) {}
    audioEl = null;
  }
  emit('voice:stop');
}

export default { speak, stop };
