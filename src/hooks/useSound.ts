import { useEffect, useRef, useState } from 'react';
import type { SoundSettings } from '../types/game';

export const useSound = () => {
  const [settings, setSettings] = useState<SoundSettings>(() => {
    const saved = localStorage.getItem('typing_combat_sound_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          sfxVolume: parsed.sfxVolume ?? 0.5,
          musicVolume: parsed.musicVolume ?? 0.3,
          sfxEnabled: parsed.sfxEnabled ?? true,
          musicEnabled: parsed.musicEnabled ?? true,
          pronounceOnDestroy: parsed.pronounceOnDestroy ?? true,
          pronunciationAccent: parsed.pronunciationAccent ?? 'us',
        };
      } catch { /* ignore */ }
    }
    return {
      sfxVolume: 0.5,
      musicVolume: 0.3,
      sfxEnabled: true,
      musicEnabled: true,
      pronounceOnDestroy: true,
      pronunciationAccent: 'us',
    };
  });

  const ctxRef = useRef<AudioContext | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const bgMusicGainRef = useRef<GainNode | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    localStorage.setItem('typing_combat_sound_settings', JSON.stringify(settings));
  }, [settings]);

  // Lazy initialize AudioContext on user interaction
  const initAudio = () => {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        ctxRef.current = new AudioCtx();
      }
    } else if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
  };

  // Helper to generate white noise buffer for explosions
  const getNoiseBuffer = (ctx: AudioContext) => {
    const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  const playLaser = () => {
    initAudio();
    if (!settings.sfxEnabled || !ctxRef.current) return;
    const ctx = ctxRef.current;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(settings.sfxVolume * 0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  };

  const playHit = () => {
    initAudio();
    if (!settings.sfxEnabled || !ctxRef.current) return;
    const ctx = ctxRef.current;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    
    gain.gain.setValueAtTime(settings.sfxVolume * 0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  const playMiss = () => {
    initAudio();
    if (!settings.sfxEnabled || !ctxRef.current) return;
    const ctx = ctxRef.current;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(75, ctx.currentTime + 0.18);
    
    gain.gain.setValueAtTime(settings.sfxVolume * 0.6, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.21);
  };

  const playExplosion = () => {
    initAudio();
    if (!settings.sfxEnabled || !ctxRef.current) return;
    const ctx = ctxRef.current;
    
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = getNoiseBuffer(ctx);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.8);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(settings.sfxVolume * 0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
    
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noiseSource.start();
    noiseSource.stop(ctx.currentTime + 1.0);
    
    // Supplement low-end punch
    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    
    boom.type = 'triangle';
    boom.frequency.setValueAtTime(120, ctx.currentTime);
    boom.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.35);
    
    boomGain.gain.setValueAtTime(settings.sfxVolume * 0.7, ctx.currentTime);
    boomGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    boom.connect(boomGain);
    boomGain.connect(ctx.destination);
    
    boom.start();
    boom.stop(ctx.currentTime + 0.45);
  };

  const playComboAlert = (comboCount: number) => {
    initAudio();
    if (!settings.sfxEnabled || !ctxRef.current) return;
    const ctx = ctxRef.current;
    
    // Choose notes of a major arpeggio based on combo
    const pitchFactor = 1 + (comboCount / 100);
    const root = 440 * pitchFactor; // A4
    const notes = [root, root * 1.25, root * 1.5, root * 2.0];
    
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(settings.sfxVolume * 0.25, ctx.currentTime + index * 0.08 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + index * 0.08);
      osc.stop(ctx.currentTime + index * 0.08 + 0.3);
    });
  };

  const playLevelUp = () => {
    initAudio();
    if (!settings.sfxEnabled || !ctxRef.current) return;
    const ctx = ctxRef.current;
    
    const scale = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major scale arpeggio
    
    scale.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.06);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(settings.sfxVolume * 0.3, ctx.currentTime + index * 0.06 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.06 + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + index * 0.06);
      osc.stop(ctx.currentTime + index * 0.06 + 0.5);
    });
  };

  const startAmbientDrone = () => {
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    if (!settings.musicEnabled || !ctxRef.current) return;
    const ctx = ctxRef.current;

    if (!bgMusicRef.current) {
      const audio = new Audio('/sound.mp3');
      audio.loop = true;
      audio.crossOrigin = 'anonymous';
      bgMusicRef.current = audio;

      const source = ctx.createMediaElementSource(audio);
      const gain = ctx.createGain();

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(settings.musicVolume * 0.5, ctx.currentTime + 2.0); // 2s smooth fade in

      source.connect(gain);
      gain.connect(ctx.destination);

      bgMusicSourceRef.current = source;
      bgMusicGainRef.current = gain;
    } else {
      const gain = bgMusicGainRef.current;
      if (gain) {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(settings.musicVolume * 0.5, ctx.currentTime + 2.0);
      }
    }

    if (bgMusicRef.current.paused) {
      bgMusicRef.current.play().catch(err => console.error("Error playing bg music:", err));
    }
  };

  const stopAmbientDrone = () => {
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    if (bgMusicRef.current && ctxRef.current) {
      const ctx = ctxRef.current;
      const audio = bgMusicRef.current;
      const gain = bgMusicGainRef.current;

      if (gain) {
        try {
          gain.gain.cancelScheduledValues(ctx.currentTime);
          gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2); // 1.2s smooth fade out
        } catch {
          // ignore
        }
      }

      stopTimeoutRef.current = setTimeout(() => {
        if (!audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
      }, 1300);
    }
  };

  // Toggle controls
  const toggleSfx = () => {
    setSettings(prev => ({
      ...prev,
      sfxEnabled: !prev.sfxEnabled,
    }));
  };

  const toggleMusic = () => {
    setSettings(prev => ({
      ...prev,
      musicEnabled: !prev.musicEnabled,
    }));
  };

  const setSfxVolume = (vol: number) => {
    setSettings(prev => ({
      ...prev,
      sfxVolume: Math.max(0, Math.min(1, vol)),
    }));
  };

  const setMusicVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setSettings(prev => ({
      ...prev,
      musicVolume: clamped,
    }));
    const ctx = ctxRef.current;
    if (bgMusicGainRef.current && ctx) {
      try {
        bgMusicGainRef.current.gain.setValueAtTime(clamped * 0.5, ctx.currentTime);
      } catch {
        // ignore
      }
    }
  };

  const speakWord = (word: string) => {
    if (!settings.pronounceOnDestroy) return;

    try {
      // Cancel any ongoing pronunciation to avoid overlapping speech queues
      window.speechSynthesis.cancel();

      // Clean up string (remove emojis, special aircraft tags)
      const cleanWord = word.replace(/[^a-zA-Z\s-]/g, '').trim();
      if (!cleanWord) return;

      const utterance = new SpeechSynthesisUtterance(cleanWord);
      utterance.lang = settings.pronunciationAccent === 'uk' ? 'en-GB' : 'en-US';

      // Select matching local voice for better performance
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.lang.startsWith(utterance.lang) && v.localService);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Sync volume with SFX volume setting
      utterance.volume = settings.sfxVolume;
      utterance.rate = 0.95; // Slightly slower for better educational clarity

      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  };

  const togglePronounce = () => {
    setSettings(prev => ({
      ...prev,
      pronounceOnDestroy: !prev.pronounceOnDestroy,
    }));
  };

  const setPronunciationAccent = (accent: 'us' | 'uk') => {
    setSettings(prev => ({
      ...prev,
      pronunciationAccent: accent,
    }));
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }
      if (bgMusicRef.current) {
        try {
          bgMusicRef.current.pause();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    settings,
    initAudio,
    startAmbientDrone,
    stopAmbientDrone,
    playLaser,
    playHit,
    playMiss,
    playExplosion,
    playComboAlert,
    playLevelUp,
    toggleSfx,
    toggleMusic,
    setSfxVolume,
    setMusicVolume,
    speakWord,
    togglePronounce,
    setPronunciationAccent,
  };
};
