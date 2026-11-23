import { useEffect, useRef, useState } from 'react';

export function useAmbientSound() {
  const [enabled, setEnabled] = useState(false);
  const audio = useRef<{ context: AudioContext; gain: GainNode } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const context = new AudioContext();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 280;
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.045, context.currentTime + 2);
    filter.connect(gain).connect(context.destination);
    const oscillators = [48, 48.35, 72.1].map((frequency, index) => {
      const oscillator = context.createOscillator();
      const level = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      level.gain.value = index === 2 ? 0.14 : 0.5;
      oscillator.connect(level).connect(filter);
      oscillator.start();
      return oscillator;
    });
    void context.resume();
    audio.current = { context, gain };
    return () => {
      const now = context.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.35);
      oscillators.forEach((oscillator) => oscillator.stop(now + 0.4));
      window.setTimeout(() => void context.close(), 450);
      audio.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'm' && !event.repeat && !(event.target instanceof HTMLInputElement)) {
        setEnabled((value) => !value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return { enabled, toggle: () => setEnabled((value) => !value) };
}
