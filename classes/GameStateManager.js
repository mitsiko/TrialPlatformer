// GameStateManager.js - Handle game state transitions and logic
class GameStateManager {
  constructor() {
    this.states = {
      INTRO: 'intro',
      PLAYING: 'playing',
      PAUSED: 'paused',
      LEVEL_COMPLETE: 'levelComplete',
      GAME_OVER: 'gameOver'
    };
    
    this.currentState = this.states.INTRO;
    this.stateChangeCallbacks = {};
    
    // Store time when state was entered
    this.stateEnteredTime = 0;
    
    // Player stats
    this.lives = 3;
    this.coins = 0;
    this.cans = 0;
    
    this.coinsCollected = new Set(); // Store collected coin positions
    this.cansCollected = new Set();  // Store collected can positions
  }
  
  init() {
    this.reset();
  }
  
  reset() {
    this.lives = 3;
    this.coins = 0;
    this.cans = 0;
    this.coinsCollected.clear();
    this.cansCollected.clear();
    this.changeState(this.states.INTRO);
  }
  
  changeState(newState) {
    const oldState = this.currentState;
    this.currentState = newState;
    this.stateEnteredTime = timeManager.gameTime;
    
    // Call any registered callbacks for this state change
    if (this.stateChangeCallbacks[newState]) {
      this.stateChangeCallbacks[newState].forEach(callback => callback(oldState));
    }
    
    // Handle special state transitions
    switch (newState) {
      case this.states.INTRO:
        soundManager.stopMusic();
        timeManager.reset();
        break;
        
      case this.states.PLAYING:
        if (oldState === this.states.INTRO || oldState === this.states.PAUSED) {
          soundManager.playMusic('intro');
        }
        break;
        
      case this.states.PAUSED:
        soundManager.pauseMusic();
        timeManager.pause();
        break;
        
      case this.states.LEVEL_COMPLETE:
        soundManager.playMusic('win');
        // Auto-transition back to intro after delay
        timeManager.setTimeout(() => {
          this.changeState(this.states.INTRO);
        }, 3);
        break;
        
      case this.states.GAME_OVER:
        soundManager.playMusic('gameOver');
        // Auto-transition back to intro after delay
        timeManager.setTimeout(() => {
          this.changeState(this.states.INTRO);
        }, 8);
        break;
    }
  }
  
  onStateChange(state, callback) {
    if (!this.stateChangeCallbacks[state]) {
      this.stateChangeCallbacks[state] = [];
    }
    this.stateChangeCallbacks[state].push(callback);
  }
  
  isState(state) {
    return this.currentState === state;
  }
  
  getStateTime() {
    return timeManager.gameTime - this.stateEnteredTime;
  }
  
  // Player stats methods
  addCoin() {
    this.coins++;
    soundManager.playSound('coin');
  }
  
  addCan() {
    this.cans++;
    this.addLife();
    soundManager.playSound('can');
  }
  
  addLife() {
    this.lives++;
  }
  
  removeLife() {
    this.lives--;
    soundManager.playSound('hurt');
    
    if (this.lives <= 0) {
      this.changeState(this.states.GAME_OVER);
    }
    
    return this.lives;
  }
  
  // Check if item was already collected
  isItemCollected(type, x, y) {
    const key = `${x},${y}`;
    if (type === 'coin') {
      return this.coinsCollected.has(key);
    } else if (type === 'can') {
      return this.cansCollected.has(key);
    }
    return false;
  }
  
  // Mark item as collected
  markItemCollected(type, x, y) {
    const key = `${x},${y}`;
    if (type === 'coin') {
      this.coinsCollected.add(key);
    } else if (type === 'can') {
      this.cansCollected.add(key);
    }
  }
}

// Export a singleton instance
const gameStateManager = new GameStateManager();