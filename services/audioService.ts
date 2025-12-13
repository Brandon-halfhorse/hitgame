export class AudioController {
  private ctx: AudioContext | null = null;
  private bgmNodes: AudioNode[] = [];
  private masterGain: GainNode | null = null;

  init() {
    if (!this.ctx) {
      // @ts-ignore - Handle older browser prefixes if necessary
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.25; // Master volume
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
    
    // Create a dark ambient drone
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    
    const filter = this.ctx.createBiquadFilter();
    const lfo = this.ctx.createOscillator(); // Low Frequency Oscillator to modulate filter
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    // Pitch increases slightly with level to build tension
    const baseFreq = 45 + (level * 2); 

    osc1.type = 'sawtooth';
    osc1.frequency.value = baseFreq;
    
    osc2.type = 'triangle';
    osc2.frequency.value = baseFreq * 1.01; // Slight detune for thickness
    
    sub.type = 'square';
    sub.frequency.value = baseFreq / 2; // Sub bass octave down

    // Filter setup
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    filter.Q.value = 1;

    // LFO to create "breathing" texture
    lfo.type = 'sine';
    lfo.frequency.value = 0.2; // Slow pulse
    lfoGain.gain.value = 200; // Filter cutoff range
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    gain.gain.value = 0.6;

    // Connections
    osc1.connect(filter);
    osc2.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    // Start
    osc1.start(t);
    osc2.start(t);
    sub.start(t);
    lfo.start(t);

    this.bgmNodes = [osc1, osc2, sub, filter, gain, lfo, lfoGain];
  }

  stopBgm() {
    this.bgmNodes.forEach(node => {
        try { (node as any).stop?.(); } catch(e){}
        node.disconnect();
    });
    this.bgmNodes = [];
  }

  playSfx(type: 'attack' | 'hit' | 'damage' | 'victory' | 'gameover') {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    switch (type) {
      case 'attack': // Quick "Swoosh"
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
        break;
      case 'hit': // Crunch impact
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
        break;
      case 'damage': // Low warning thud
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.linearRampToValueAtTime(50, t + 0.2);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
        break;
      case 'victory': // Major Chord Arpeggio
        this.playMelody([523.25, 659.25, 783.99, 1046.50], 0.12);
        break;
      case 'gameover': // Sad slide down
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