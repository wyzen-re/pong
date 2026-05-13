class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterVolume = 0.7;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        
        this.masterGain = this.audioContext.createGain();
        this.musicGain = this.audioContext.createGain();
        this.sfxGain = this.audioContext.createGain();
        
        this.masterGain.connect(this.audioContext.destination);
        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        
        this.updateVolumes();
        
        this.musicOscillators = [];
        this.isPlayingMusic = false;
        
        // Load saved settings
        this.loadSettings();
    }
    
    saveSettings() {
        localStorage.setItem('audioSettings', JSON.stringify({
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume
        }));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('audioSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.masterVolume = settings.masterVolume || 0.7;
            this.musicVolume = settings.musicVolume || 0.5;
            this.sfxVolume = settings.sfxVolume || 0.7;
            this.updateVolumes();
        }
    }
    
    updateVolumes() {
        this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
        this.musicGain.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.audioContext.currentTime);
    }
    
    setMasterVolume(value) {
        this.masterVolume = value / 100;
        this.updateVolumes();
        this.saveSettings();
    }
    
    setMusicVolume(value) {
        this.musicVolume = value / 100;
        this.updateVolumes();
        this.saveSettings();
    }
    
    setSfxVolume(value) {
        this.sfxVolume = value / 100;
        this.updateVolumes();
        this.saveSettings();
    }
    
    playMenuMusic() {
        if (this.isPlayingMusic) return;
        this.isPlayingMusic = true;
        
        const now = this.audioContext.currentTime;
        const tempo = 2; // 2 seconds per beat
        
        // Create ambient background
        const ambientOsc = this.audioContext.createOscillator();
        ambientOsc.type = 'sine';
        ambientOsc.frequency.setValueAtTime(55, now); // Low frequency
        const ambientGain = this.audioContext.createGain();
        ambientGain.gain.setValueAtTime(0.05, now);
        ambientOsc.connect(ambientGain);
        ambientGain.connect(this.musicGain);
        ambientOsc.start(now);
        
        // Main melody
        const notes = [
            { freq: 440, duration: 0.5 },  // A4
            { freq: 494, duration: 0.5 },  // B4
            { freq: 523, duration: 1 },    // C5
            { freq: 587, duration: 0.5 },  // D5
            { freq: 523, duration: 0.5 },  // C5
        ];
        
        let time = now;
        const playNote = (freq, duration) => {
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.linearRampToValueAtTime(0, time + duration);
            
            osc.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start(time);
            osc.stop(time + duration);
            
            time += duration;
        };
        
        // Play notes in a loop
        for (let i = 0; i < 4; i++) {
            notes.forEach(note => {
                if (this.isPlayingMusic) {
                    playNote(note.freq, note.duration);
                }
            });
        }
        
        this.musicOscillators.push(ambientOsc);
        
        // Stop after 32 beats
        setTimeout(() => {
            if (this.isPlayingMusic) {
                this.playMenuMusic();
            }
        }, (notes.reduce((sum, n) => sum + n.duration, 0) * 4 + 1) * 1000);
    }
    
    stopMenuMusic() {
        this.isPlayingMusic = false;
        this.musicOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {}
        });
        this.musicOscillators = [];
    }
    
    playPaddleHit() {
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.1);
    }
    
    playWallBounce() {
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.08);
    }
    
    playScore() {
        const now = this.audioContext.currentTime;
        
        const notes = [523, 659, 784]; // C5, E5, G5
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            
            gain.gain.setValueAtTime(0.1, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.2);
        });
    }
    
    playAbility() {
        const now = this.audioContext.currentTime;
        
        // Create a whoosh effect
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.3);
    }
    
    playGameOver(won) {
        const now = this.audioContext.currentTime;
        
        if (won) {
            // Victory sound
            const notes = [523, 659, 784, 1046]; // C5, E5, G5, C6
            notes.forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.15);
                
                gain.gain.setValueAtTime(0.12, now + i * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
                
                osc.connect(gain);
                gain.connect(this.sfxGain);
                
                osc.start(now + i * 0.15);
                osc.stop(now + i * 0.15 + 0.4);
            });
        } else {
            // Defeat sound
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.8);
            
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            
            osc.start(now);
            osc.stop(now + 0.8);
        }
    }
    
    playMenuSelect() {
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.linearRampToValueAtTime(659, now + 0.15);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }
}

// Global audio manager instance
let audioManager;
