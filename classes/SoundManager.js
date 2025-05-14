// SoundManager.js - Handle all game sounds and music
class SoundManager {
  constructor() {
    this.sounds = {};
    this.music = {};
    this.currentMusic = null;
    this.musicVolume = 0.5;
    this.soundVolume = 0.7;
    this.initialized = false;
  }

  init() {
    // Load all sounds and music
    this.loadMusic('intro', 'sounds/mostlyChimesTrimmed.mp3');
    this.loadMusic('win', 'sounds/winningTrimmed.mp3');
    this.loadMusic('gameOver', 'sounds/flatliningTrimmed.mp3');
    
    // Load sound effects
    this.loadSound('jump', 'sounds/jumping.mp3');
    this.loadSound('coin', 'sounds/coinDropTrimmed.mp3');
    this.loadSound('can', 'sounds/metalTrimmed.mp3');
    this.loadSound('hurt', 'sounds/landingTrimmed.mp3');
    
    this.initialized = true;
  }
  
  loadSound(name, url) {
    const audio = new Audio(url);
    audio.volume = this.soundVolume;
    this.sounds[name] = audio;
    return audio;
  }
  
  loadMusic(name, url) {
    const audio = new Audio(url);
    audio.volume = this.musicVolume;
    audio.loop = true;
    this.music[name] = audio;
    return audio;
  }
  
  playSound(name) {
    if (!this.initialized) return;
    
    const sound = this.sounds[name];
    if (sound) {
      // Clone the sound to allow multiple instances
      const soundClone = sound.cloneNode();
      soundClone.volume = this.soundVolume;
      soundClone.play();
    }
  }
  
  playMusic(name) {
    // Stop any currently playing music first
    if (this.currentMusic && this.music[this.currentMusic]) {
      this.music[this.currentMusic].pause();
    }

    const music = this.music[name];
    if (music) {
      music.currentTime = 0;
      music.play().catch(e => {
        console.log("Audio play prevented:", e);
        // Implement audio play promise handling
        document.addEventListener('click', () => {
          music.play().catch(e => console.log("Still prevented:", e));
        }, { once: true });
      });
      this.currentMusic = name;
    }
  }

  
  stopMusic() {
    if (this.currentMusic && this.music[this.currentMusic]) {
      this.music[this.currentMusic].pause();
      this.music[this.currentMusic].currentTime = 0;
    }
    this.currentMusic = null;
  }
  
  pauseMusic() {
    if (this.currentMusic && this.music[this.currentMusic]) {
      this.music[this.currentMusic].pause();
    }
  }
  
  resumeMusic() {
    if (this.currentMusic && this.music[this.currentMusic]) {
      this.music[this.currentMusic].play();
    }
  }
  
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    // Update all music volumes
    Object.values(this.music).forEach(audio => {
      audio.volume = this.musicVolume;
    });
  }
  
  setSoundVolume(volume) {
    this.soundVolume = Math.max(0, Math.min(1, volume));
    
    // Update all sound volumes
    Object.values(this.sounds).forEach(audio => {
      audio.volume = this.soundVolume;
    });
  }
}
