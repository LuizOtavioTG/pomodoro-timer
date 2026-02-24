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
      this.scheduleAlarmPattern(audioContext, startTime);
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

  private scheduleAlarmPattern(
    audioContext: AudioContext,
    startTime: number
  ): void {
    const alarmBursts = 6;
    const burstInterval = 0.24;

    for (let index = 0; index < alarmBursts; index++) {
      const frequency = index % 2 === 0 ? 740 : 980;
      this.scheduleTone(
        audioContext,
        startTime + index * burstInterval,
        frequency,
        0.18
      );
    }
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

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.01);
    gain.gain.setValueAtTime(0.12, endTime - 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startTime);
    oscillator.stop(endTime);
  }
}
