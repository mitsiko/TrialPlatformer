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
        this.stateEnteredTime = 0;
        this.lives = 3;
        this.coins = 0;
        this.cans = 0;
        this.coinsCollected = new Set();
        this.cansCollected = new Set();
        this.waitingForKeypress = false;
        this.totalCoinsInMap = 0; // To be calculated on init
    }
    
    startGame() {
        if (this.currentState === this.states.INTRO) {
            this.changeState(this.states.PLAYING);
        } else if (this.currentState === this.states.PAUSED) {
            this.changeState(this.states.PLAYING);
        } else if (this.waitingForKeypress) {
            if (this.currentState === this.states.LEVEL_COMPLETE || 
                this.currentState === this.states.GAME_OVER) {
                this.changeState(this.states.INTRO);
                this.waitingForKeypress = false;
            }
        }
    }
    
    init() {
        this.reset();
        
        // Calculate total coins in the map
        this.totalCoinsInMap = 0;
        if (layersData && layersData.l_Coins) {
            layersData.l_Coins.forEach(row => {
                row.forEach(tile => {
                    if (tile !== 0) this.totalCoinsInMap++;
                });
            });
        }
        console.log(`Total coins in map: ${this.totalCoinsInMap}`);
    }
    
    // Replace the current reset() method with this improved version:
    reset() {
        // Don't directly call changeState here to avoid triggering callbacks before init is complete
        this.currentState = this.states.INTRO;
        this.stateEnteredTime = timeManager.gameTime;
        this.lives = 3;
        this.coins = 0;
        this.cans = 0;
        this.coinsCollected.clear();
        this.cansCollected.clear();
        this.waitingForKeypress = false;
        
        // Make sure timer is reset properly
        if (timeManager) {
            timeManager.reset();
        }
        
        // Stop any playing music
        if (soundManager) {
            soundManager.stopMusic();
        }
        
        // Reset player position to initial position - MODIFIED TO MATCH YOUR IMPLEMENTATION
        if (player) {
            player.x = 100;
            player.y = 100;
            player.velocity.x = 0;
            player.velocity.y = 0;
            player.movementState = 'idle'; // Changed from player.states.idle
            player.animation.play('idle', true); // Reset animation
            player.isInvincible = false;
            player.invincibilityTimer = 0;
        }
        
        // Reset camera position
        if (cameraController) {
            cameraController.x = 0;
            cameraController.y = 0;
            cameraController.targetX = 0;
            cameraController.targetY = 0;
        }
    }
    
    changeState(newState) {
        const oldState = this.currentState;
        this.currentState = newState;
        this.stateEnteredTime = timeManager.gameTime;
        
        // Trigger callbacks for the new state
        if (this.stateChangeCallbacks[newState]) {
            this.stateChangeCallbacks[newState].forEach(callback => callback(oldState));
        }
        
        switch (newState) {
            case this.states.INTRO:
                soundManager.stopMusic();
                timeManager.reset();
                this.lives = 3;
                this.coins = 0;
                this.cans = 0;
                this.coinsCollected.clear();
                this.cansCollected.clear();
                this.waitingForKeypress = false;
                break;
                
            case this.states.PLAYING:
                timeManager.resume();
                if (oldState === this.states.INTRO || oldState === this.states.PAUSED) {
                    soundManager.playMusic('intro');
                }
                this.waitingForKeypress = false;
                break;
                
            case this.states.PAUSED:
                soundManager.pauseMusic();
                timeManager.pause();
                this.waitingForKeypress = false;
                break;
                
            case this.states.LEVEL_COMPLETE:
                timeManager.pause(); // Stop the timer
                soundManager.playMusic('win');
                // Wait for keypress to go back to intro
                this.waitingForKeypress = true;
                break;
                
            case this.states.GAME_OVER:
                timeManager.pause(); // Stop the timer
                soundManager.playMusic('gameOver');
                // Wait for keypress to go back to intro
                this.waitingForKeypress = true;
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
    
    // Check if all coins have been collected
    areAllCoinsCollected() {
        return this.coins >= this.totalCoinsInMap && this.totalCoinsInMap > 0;
    }
    
    // Method to handle keypress events based on current state
    handleKeyPress(key) {
        if (this.isState(this.states.INTRO)) {
            // Any key starts the game from intro
            this.startGame();
        } else if (this.isState(this.states.PAUSED) && key.toLowerCase() === 'enter') {
            // Only Enter key resumes from pause
            this.changeState(this.states.PLAYING);
        } else if ((this.isState(this.states.LEVEL_COMPLETE) || this.isState(this.states.GAME_OVER)) && 
                   this.waitingForKeypress) {
            // Any key from level complete or game over goes to intro
            this.changeState(this.states.INTRO);
        }
    }
}