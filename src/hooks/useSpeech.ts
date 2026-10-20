import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type Recognition = { continuous: boolean; interimResults: boolean; lang: string; start(): void; stop(): void; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: ((event: { error: string }) => void) | null; onend: (() => void) | null };
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
export function useSpeech(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const callback = useRef(onText);
  callback.current = onText;
  useEffect(() => {
    const w = window as SpeechWindow;
    setSupported(Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition));
    return () => recognition.current?.stop();
  }, []);
  function toggle() {
    if (listening) { recognition.current?.stop(); return; }
    const w = window as SpeechWindow;
    const Constructor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Constructor) { toast.error('Voice input is unavailable in this browser. You can type your answer.'); return; }
    const r = new Constructor();
    r.continuous = false; r.interimResults = false; r.lang = 'en-US';
    r.onresult = e => callback.current(Array.from(e.results).map(result => result[0]?.transcript ?? '').join(' '));
    r.onerror = e => { setListening(false); toast.error(e.error === 'not-allowed' ? 'Microphone access was denied. You can type your answer.' : 'Voice input stopped. You can type your answer.'); };
    r.onend = () => setListening(false);
    recognition.current = r;
    try { r.start(); setListening(true); } catch { toast.error('Could not start the microphone.'); }
  }
  return { listening, supported, toggle };
}
