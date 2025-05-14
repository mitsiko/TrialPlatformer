// Debug version - logs all key events
console.log("Initializing event listeners...");

window.addEventListener('keydown', (event) => {
    // Allow any key to start game from intro
    if (gameStateManager && gameStateManager.currentState === gameStateManager.states.INTRO) {
      gameStateManager.startGame();
      return;
    }
    
    if (gameStateManager && gameStateManager.currentState !== gameStateManager.states.PLAYING) {
        console.log("Ignoring input - game not in PLAYING state");
        return;
    }

    switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            console.log("Jump key pressed");
            // Handle jumping logic here
            if (keys.a.pressed || keys.d.pressed) {
                // Directional jump
                player.jump();
            } else {
                // Vertical hop
                player.verticalHop();
            }
            keys.w.pressed = true;
            break;
            
        case 'a':
        case 'arrowleft':
            console.log("Moving LEFT");
            keys.a.pressed = true;
            break;
            
        case 'd':
        case 'arrowright':
            console.log("Moving RIGHT");
            keys.d.pressed = true;
            break;
            
        case 'escape':
            console.log("Pause toggled");
            // Pause logic handled elsewhere
            break;
    }
});

window.addEventListener('keyup', (event) => {
    console.log(`Key UP: ${event.key}`);
    
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