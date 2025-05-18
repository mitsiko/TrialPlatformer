// ./js/index.js

// Check if scripts loaded
console.log("Player class defined:", typeof Player !== "undefined");
console.log("GameStateManager defined:", typeof GameStateManager !== "undefined");
// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const c = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;

// Set canvas size
canvas.style.width = '1184px';
canvas.style.height = '736px';
canvas.width = 1184 * dpr;
canvas.height = 736 * dpr;

// Initialize core systems
const timeManager = new TimeManager();
const soundManager = new SoundManager();
const gameStateManager = new GameStateManager();

// Add this right after: const gameStateManager = new GameStateManager();
gameStateManager.onStateChange(gameStateManager.states.PLAYING, () => {
  timeManager.resume();
});

gameStateManager.onStateChange(gameStateManager.states.PAUSED, () => {
  timeManager.pause();
});

const cameraController = new CameraController(canvas, dpr); // Updated initialization
const hud = new HUD();
const gameRenderer = new GameRenderer();

// Add state change listeners
gameStateManager.onStateChange(gameStateManager.states.PLAYING, () => {
    timeManager.resume();
    soundManager.resumeMusic();
});

gameStateManager.onStateChange(gameStateManager.states.PAUSED, () => {
    timeManager.pause();
    soundManager.pauseMusic();
});

// Initialize your map data (keep this part exactly as is)
const layersData = {
   l_BackgroundColor: l_BackgroundColor,
   l_Pines1: l_Pines1,
   l_Pines2: l_Pines2,
   l_Pines3: l_Pines3,
   l_Pines4: l_Pines4,
   l_Platforms1: l_Platforms1,
   l_Platfroms2: l_Platfroms2,
   l_Spikes: l_Spikes,
   l_Collisions: l_Collisions,
   l_Grass: l_Grass,
   l_Coins: l_Coins,
   l_Cans: l_Cans,
};

const tilesets = {
  l_BackgroundColor: { imageUrl: './images/1a0f394a-828c-42e4-4be3-d9ff5e745800.png', tileSize: 16 },
  l_Pines1: { imageUrl: './images/d59a674b-f898-4ffa-931e-b06142e92300.png', tileSize: 16 },
  l_Pines2: { imageUrl: './images/d59a674b-f898-4ffa-931e-b06142e92300.png', tileSize: 16 },
  l_Pines3: { imageUrl: './images/d59a674b-f898-4ffa-931e-b06142e92300.png', tileSize: 16 },
  l_Pines4: { imageUrl: './images/d59a674b-f898-4ffa-931e-b06142e92300.png', tileSize: 16 },
  l_Platforms1: { imageUrl: './images/1a0f394a-828c-42e4-4be3-d9ff5e745800.png', tileSize: 16 },
  l_Platfroms2: { imageUrl: './images/1a0f394a-828c-42e4-4be3-d9ff5e745800.png', tileSize: 16 },
  l_Spikes: { imageUrl: './images/1a0f394a-828c-42e4-4be3-d9ff5e745800.png', tileSize: 16 },
  l_Collisions: { imageUrl: './images/1a0f394a-828c-42e4-4be3-d9ff5e745800.png', tileSize: 16 },
  l_Grass: { imageUrl: './images/1a0f394a-828c-42e4-4be3-d9ff5e745800.png', tileSize: 16 },
  l_Coins: { imageUrl: './images/CoinSprite.png', tileSize: 16 },
  l_Cans: { imageUrl: './images/CanSprite.png', tileSize: 16 },
};

console.log("Game starting...");

// Basic canvas check
if (!canvas) {
  console.error("Canvas element not found!");
} else {
  console.log("Canvas dimensions:", canvas.width, "x", canvas.height);
}

// Context check
if (!c) {
  console.error("Could not get 2D context!");
} else {
  console.log("2D context obtained successfully");
}

// Tile setup (keep this exactly as is)
const collisionBlocks = []
const platforms = []
const blockSize = 16

let lastTime = performance.now();


collisions.forEach((row, y) => {
  row.forEach((symbol, x) => {
    if (symbol === 1) {
      collisionBlocks.push(
        new CollisionBlock({
          x: x * blockSize,
          y: y * blockSize,
          size: blockSize,
        }),
      )
    } else if (symbol === 2) {
      platforms.push(
        new Platform({
          x: x * blockSize,
          y: y * blockSize + blockSize,
          width: 16,
          height: 4,
        }),
      )
    }
  })
})

const renderLayer = (tilesData, tilesetImage, tileSize, context, scale = 1) => {
  const tilesPerRow = Math.ceil(tilesetImage.width / tileSize);
  
  // Round scale to nearest integer to prevent floating-point artifacts
  const roundedScale = Math.round(scale);
  
  tilesData.forEach((row, y) => {
    row.forEach((symbol, x) => {
      if (symbol !== 0) {
        const tileIndex = symbol - 1;
        const srcX = (tileIndex % tilesPerRow) * tileSize;
        const srcY = Math.floor(tileIndex / tilesPerRow) * tileSize;
        
        // Use integer positions and dimensions
        const destX = Math.round(x * 16 * roundedScale);
        const destY = Math.round(y * 16 * roundedScale);
        const destSize = Math.round(16 * roundedScale);
        
        context.imageSmoothingEnabled = false; // Disable anti-aliasing
        context.drawImage(
          tilesetImage,
          srcX, srcY,
          tileSize, tileSize,
          destX, destY,
          destSize, destSize
        );
      }
    });
  });
};

const renderStaticLayers = async () => {
  const offscreenCanvas = document.createElement('canvas')
  // Calculate scale factor based on canvas height (691.2px) and map height (352px)
  const scale = canvas.height / (layersData.l_Collisions.length * 16)
  offscreenCanvas.width = layersData.l_Collisions[0].length * 16 * scale
  offscreenCanvas.height = canvas.height // Match canvas height
  const offscreenContext = offscreenCanvas.getContext('2d')

  for (const [layerName, tilesData] of Object.entries(layersData)) {
    const tilesetInfo = tilesets[layerName]
    if (tilesetInfo) {
      try {
        const tilesetImage = await loadImage(tilesetInfo.imageUrl)
        renderLayer(tilesData, tilesetImage, tilesetInfo.tileSize, offscreenContext, scale)
      } catch (error) {
        console.error(`Failed to load image for layer ${layerName}:`, error)
      }
    }
  }
  return {
    canvas: offscreenCanvas,
    scale: scale
  };
}

// Initialize player (keep your existing initialization)
const player = new Player({
  x: 100,
  y: 100,
  size: 32, // Make sure this matches your sprite size
  velocity: { x: 0, y: 0 }
});

const keys = {
  w: { pressed: false },
  a: { pressed: false },
  d: { pressed: false }
}

// MODIFIED GAME LOOP
async function animate(backgroundCanvas) {
  if (!backgroundCanvas) {
    console.error("Background canvas is null!");
    
    // Draw a test pattern
    c.fillStyle = '#ff0000';
    c.fillRect(0, 0, canvas.width/2, canvas.height/2);
    c.fillStyle = '#00ff00';
    c.fillRect(canvas.width/2, 0, canvas.width/2, canvas.height/2);
    c.fillStyle = '#0000ff';
    c.fillRect(0, canvas.height/2, canvas.width/2, canvas.height/2);
    c.fillStyle = '#ffffff';
    c.fillRect(canvas.width/2, canvas.height/2, canvas.width/2, canvas.height/2);
    
    requestAnimationFrame(() => animate(backgroundCanvas));
    return;
  }

    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Now properly defined
    lastTime = currentTime;
    
    // Debug log - show game state and player info
    console.log(`Frame - State: ${gameStateManager.currentState} | ` +
              `Player: [X:${player.x.toFixed(1)}, Y:${player.y.toFixed(1)}] | ` +
              `Velocity: [X:${player.velocity.x.toFixed(1)}, Y:${player.velocity.y.toFixed(1)}]`);
  
    // Clear canvas
    c.clearRect(0, 0, canvas.width, canvas.height);

    // Always update these systems regardless of game state
    timeManager.update(deltaTime);
    
    // Only update gameplay elements when in PLAYING state
    if (gameStateManager.currentState === gameStateManager.states.PLAYING) {
        cameraController.update(player);
        player.handleInput(keys);
        player.update(deltaTime, collisionBlocks, platforms);

        
        // Check item collisions only when playing
        player.checkItemCollisions(layersData.l_Coins, 'coin');
        player.checkItemCollisions(layersData.l_Cans, 'can');
    }

    // Apply camera transform
    cameraController.applyTransform(c);
    
    // Draw background
    c.drawImage(backgroundCanvas, 0, 0);
    
    // Draw player (always draw, even when paused)
    player.draw(c);
    
    // Reset transform before UI
    cameraController.resetTransform(c);
    
    // Always draw HUD
    hud.draw(c);

    // Continue the game loop
    requestAnimationFrame(() => animate(backgroundCanvas));
}

// MODIFIED START FUNCTION
const startGame = async () => {
  try {
    // Add loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.style.position = 'fixed';
    loadingDiv.style.top = '0';
    loadingDiv.style.left = '0';
    loadingDiv.style.width = '100%';
    loadingDiv.style.height = '100%';
    loadingDiv.style.backgroundColor = 'black';
    loadingDiv.style.color = 'white';
    loadingDiv.style.display = 'flex';
    loadingDiv.style.flexDirection = 'column';
    loadingDiv.style.justifyContent = 'center';
    loadingDiv.style.alignItems = 'center';
    loadingDiv.style.zIndex = '1000';
    loadingDiv.innerHTML = '<h1>Loading Game...</h1><div id="loading-progress">Initializing</div>';
    document.body.appendChild(loadingDiv);

    // In startGame():
    const scale = canvas.height / (layersData.l_Collisions.length * 16);
    player.setScale(scale);


    const updateProgress = (message) => {
      document.getElementById('loading-progress').textContent = message;
    };

    updateProgress('Initializing systems...');
    await Promise.all([
      hud.init(),
      soundManager.init(),
      gameStateManager.init(),
      player.init()
    ]);

    updateProgress('Loading map...');
    const { canvas: backgroundCanvas, scale } = await renderStaticLayers();
    
    if (!backgroundCanvas) {
      throw new Error("Failed to create background canvas");
    }

    updateProgress('Initializing player...');
    player.setScale(scale);

    updateProgress('Initializing camera...');
    const mapWidth = layersData.l_Collisions[0].length * 16 * scale;
    const mapHeight = layersData.l_Collisions.length * 16 * scale;
    cameraController.init(mapWidth, mapHeight, scale);

    updateProgress('Starting game...');
    lastTime = performance.now();
    animate(backgroundCanvas);

    // Remove loading indicator after short delay
    setTimeout(() => {
      document.body.removeChild(loadingDiv);
      gameStateManager.changeState(gameStateManager.states.INTRO);
    }, 500);
    
  } catch (error) {
    console.error('Game initialization failed:', error);
    // Show error to player
    document.body.innerHTML = `
      <div style="color: white; background: #333; padding: 20px; font-family: sans-serif;">
        <h1>Game Failed to Load</h1>
        <p>${error.message}</p>
        <p>Please check console for details and refresh</p>
      </div>
    `;
  }
};
// Start the game
startGame();

// ./js/eventListeners.js
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
            // Only process jump if not already jumping
            if (!keys.w.pressed) {
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
            // Toggle between playing and paused states
            if (gameStateManager.currentState === gameStateManager.states.PLAYING) {
                gameStateManager.changeState(gameStateManager.states.PAUSED);
            } else if (gameStateManager.currentState === gameStateManager.states.PAUSED) {
                gameStateManager.changeState(gameStateManager.states.PLAYING);
            }
            break;
            
        case 'enter':
            // Resume game if paused
            if (gameStateManager.currentState === gameStateManager.states.PAUSED) {
                gameStateManager.changeState(gameStateManager.states.PLAYING);
            }
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