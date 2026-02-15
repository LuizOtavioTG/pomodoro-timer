import { Injectable } from '@angular/core';

interface WindowWithWebKitAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

@Injectable({
  providedIn: 'root',
})
export class PomodoroSoundNotificationService {
  private audioContext?: AudioContext;

  prepare(): void {
    const audioContext = this.getAudioContext();

    if (audioContext?.state === 'suspended') {
      void audioContext.resume();
    }
  }

  async playSessionEndAlert(): Promise<void> {
    const audioContext = this.getAudioContext();

    if (!audioContext) {
      return;
    }

    try {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const startTime = audioContext.currentTime;
      this.scheduleTone(audioContext, startTime, 880, 0.16);
      this.scheduleTone(audioContext, startTime + 0.22, 1175, 0.22);
    } catch {
      return;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const audioContextConstructor = window.AudioContext
      ?? (window as WindowWithWebKitAudioContext).webkitAudioContext;

    if (!audioContextConstructor) {
      return null;
    }

    this.audioContext ??= new audioContextConstructor();

    return this.audioContext;
  }

  private scheduleTone(
    audioContext: AudioContext,
    startTime: number,
    frequency: number,
    duration: number
  ): void {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const endTime = startTime + duration;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startTime);
    oscillator.stop(endTime);
  }
}
