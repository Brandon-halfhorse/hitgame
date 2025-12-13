export class AudioController {
  private ctx: AudioContext | null = null;
  private bgmNodes: AudioNode[] = [];
  private masterGain: GainNode | null = null;

  init() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.25; 
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playBgm(level: number) {
    if (!this.ctx || !this.masterGain) return;
    this.stopBgm();

    const t = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    const baseFreq = 45 + (level * 2); 

    osc1.type = 'sawtooth';
    osc1.frequency.value = baseFreq;
    osc2.type = 'triangle';
    osc2.frequency.value = baseFreq * 1.01;
    sub.type = 'square';
    sub.frequency.value = baseFreq / 2;

    filter.type = 'lowpass';
    filter.frequency.value = 300;
    
    gain.gain.value = 0.6;

    osc1.connect(filter);
    osc2.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    sub.start(t);

    this.bgmNodes = [osc1, osc2, sub, filter, gain];
  }

  stopBgm() {
    this.bgmNodes.forEach(node => {
        try { (node as any).stop?.(); } catch(e){}
        node.disconnect();
    });
    this.bgmNodes = [];
  }

  playSfx(type: 'attack' | 'hit' | 'damage' | 'victory' | 'gameover' | 'loot' | 'skill' | 'buy') {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    switch (type) {
      case 'attack': 
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
        break;
      case 'skill': // High pitch swoosh
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.2);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
        break;
      case 'hit': 
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
        break;
      case 'loot': // Coin sound
        this.playMelody([1200, 1600], 0.05);
        break;
      case 'buy': // Register sound
        this.playMelody([800, 1000], 0.1);
        break;
      case 'damage': 
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.linearRampToValueAtTime(50, t + 0.2);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
        break;
      case 'victory': 
        this.playMelody([523.25, 659.25, 783.99, 1046.50], 0.12);
        break;
      case 'gameover':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 1.5);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.linearRampToValueAtTime(0, t + 1.5);
        osc.start(t);
        osc.stop(t + 1.5);
        break;
    }
  }

  playMelody(notes: number[], duration: number) {
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      notes.forEach((freq, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.connect(gain);
          gain.connect(this.masterGain!);
          
          osc.type = 'sine';
          osc.frequency.value = freq;
          
          const startTime = t + (i * duration);
          gain.gain.setValueAtTime(0.3, startTime);
          gain.gain.linearRampToValueAtTime(0, startTime + duration);
          
          osc.start(startTime);
          osc.stop(startTime + duration);
      });
  }
}

export const audioManager = new AudioController();