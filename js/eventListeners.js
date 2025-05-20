// ./js/eventListeners.js
// Fixed event listeners
console.log("Initializing event listeners...");

// Keydown event listener
window.removeEventListener('keydown', window.keydownListener);
window.keydownListener = (event) => {
    switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            // Any key can transition from intro to playing
            if (gameStateManager.currentState === gameStateManager.states.INTRO) {
                gameStateManager.startGame();
                return;
            }
            
            // Wait for keypress in level complete and game over states
            if (gameStateManager.waitingForKeypress && 
                (gameStateManager.currentState === gameStateManager.states.LEVEL_COMPLETE ||
                 gameStateManager.currentState === gameStateManager.states.GAME_OVER)) {
                gameStateManager.changeState(gameStateManager.states.INTRO);
                return;
            }
            
            // Regular jump logic - only in PLAYING state
            if (gameStateManager.currentState === gameStateManager.states.PLAYING && !keys.w.pressed) {
                // Handle jumping logic here
                if (keys.a.pressed || keys.d.pressed) {
                    // Directional jump
                    player.jump();
                } else {
                    // Vertical hop
                    player.verticalHop();
                }
                keys.w.pressed = true;
            }
            break;
            
        case 'a':
        case 'arrowleft':
            // Any key can transition from intro to playing
            if (gameStateManager.currentState === gameStateManager.states.INTRO) {
                gameStateManager.startGame();
                return;
            }
            
            // Wait for keypress in level complete and game over states
            if (gameStateManager.waitingForKeypress && 
                (gameStateManager.currentState === gameStateManager.states.LEVEL_COMPLETE ||
                 gameStateManager.currentState === gameStateManager.states.GAME_OVER)) {
                gameStateManager.changeState(gameStateManager.states.INTRO);
                return;
            }
            
            // Regular movement - only in PLAYING state
            if (gameStateManager.currentState === gameStateManager.states.PLAYING) {
                keys.a.pressed = true;
            }
            break;
            
        case 'd':
        case 'arrowright':
            // Any key can transition from intro to playing
            if (gameStateManager.currentState === gameStateManager.states.INTRO) {
                gameStateManager.startGame();
                return;
            }
            
            // Wait for keypress in level complete and game over states
            if (gameStateManager.waitingForKeypress && 
                (gameStateManager.currentState === gameStateManager.states.LEVEL_COMPLETE ||
                 gameStateManager.currentState === gameStateManager.states.GAME_OVER)) {
                gameStateManager.changeState(gameStateManager.states.INTRO);
                return;
            }
            
            // Regular movement - only in PLAYING state
            if (gameStateManager.currentState === gameStateManager.states.PLAYING) {
                keys.d.pressed = true;
            }
            break;
            
        case 'escape':
            // Only toggle pause when in PLAYING state
            if (gameStateManager.currentState === gameStateManager.states.PLAYING) {
                gameStateManager.changeState(gameStateManager.states.PAUSED);
            } else if (gameStateManager.currentState === gameStateManager.states.PAUSED) {
                // Escape can also resume from pause
                gameStateManager.changeState(gameStateManager.states.PLAYING);
            }
            break;
            
        case 'enter':
            // Resume game if paused
            if (gameStateManager.currentState === gameStateManager.states.PAUSED) {
                gameStateManager.changeState(gameStateManager.states.PLAYING);
            }
            
            // Any key can transition from intro to playing
            if (gameStateManager.currentState === gameStateManager.states.INTRO) {
                gameStateManager.startGame();
                return;
            }
            
            // Wait for keypress in level complete and game over states
            if (gameStateManager.waitingForKeypress && 
                (gameStateManager.currentState === gameStateManager.states.LEVEL_COMPLETE ||
                 gameStateManager.currentState === gameStateManager.states.GAME_OVER)) {
                gameStateManager.changeState(gameStateManager.states.INTRO);
            }
            break;
            
        default:
            // For any other key, handle general state transitions
            // Any key can transition from intro to playing
            if (gameStateManager.currentState === gameStateManager.states.INTRO) {
                gameStateManager.startGame();
                return;
            }
            
            // Wait for keypress in level complete and game over states
            if (gameStateManager.waitingForKeypress && 
                (gameStateManager.currentState === gameStateManager.states.LEVEL_COMPLETE ||
                 gameStateManager.currentState === gameStateManager.states.GAME_OVER)) {
                gameStateManager.changeState(gameStateManager.states.INTRO);
            }
            break;
    }
};
window.addEventListener('keydown', window.keydownListener);

window.addEventListener('keyup', (event) => {
    // Only handle key up events if we're in PLAYING state
    if (gameStateManager.currentState !== gameStateManager.states.PLAYING) return;
    
    switch (event.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
            keys.a.pressed = false;
            break;
            
        case 'd':
        case 'arrowright':
            keys.d.pressed = false;
            break;
            
        case 'w':
        case 'arrowup':
            keys.w.pressed = false;
            break;
    }
});

console.log("Event listeners initialized");

// Handle tab visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    lastTime = performance.now();
    
    // Resume game if it was playing when tab was hidden
    if (gameStateManager.currentState === gameStateManager.states.PLAYING) {
      timeManager.resume();
    }
  } else {
    // Pause game when tab is hidden
    if (gameStateManager.currentState === gameStateManager.states.PLAYING) {
      timeManager.pause();
    }
  }
});