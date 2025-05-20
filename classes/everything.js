// ./js/index.js
// ./js/index.js - MODIFIED SECTION


// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const c = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;
const totalCoins = 58;

// Set canvas size - MODIFIED
// Set canvas size with proper scaling for pixel art
function setupCanvas() {
  // Set logical canvas size - dimensions need to maintain 16:9 ratio for best results
  const CANVAS_WIDTH = 736;
  const CANVAS_HEIGHT = 448;
  
  // Set canvas display size (CSS size)
  canvas.style.width = `${CANVAS_WIDTH}px`;
  canvas.style.height = `${CANVAS_HEIGHT}px`;
  
  // Set actual canvas size accounting for DPR for crisp pixels
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  
  // Scale all drawing operations by DPR
  c.scale(dpr, dpr);
  
  // Ensure pixel art rendering is crisp
  c.imageSmoothingEnabled = false;
  
  console.log(`Canvas initialized at ${CANVAS_WIDTH}x${CANVAS_HEIGHT} with DPR ${dpr}`);
  console.log(`Actual canvas buffer size: ${canvas.width}x${canvas.height}`);
}

// Call this function to set up the canvas properly
setupCanvas();

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

const cameraController = new CameraController(canvas, dpr);
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

// Initialize your map data (no changes)
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

// Tile setup (no changes)
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

const calculateOptimalScale = (canvasHeight, mapNativeHeight, dpr) => {
  // Calculate how many times the map should be scaled to fit the canvas height
  // Adjust for device pixel ratio
  const viewHeight = canvasHeight / dpr;
  let scale = viewHeight / mapNativeHeight;
  
  // Optionally round to nearest integer scale for perfect pixel rendering
  // Uncomment if you prefer integer scaling:
  // scale = Math.max(1, Math.floor(scale));
  
  console.log(`Calculated scale: ${scale} (Canvas: ${viewHeight}px, Map: ${mapNativeHeight}px)`);
  return scale;
};

// MODIFIED: Updated renderLayer function for pixel-perfect rendering
const renderLayer = (tilesData, tilesetImage, tileSize, context, scale = 1) => {
  const tilesPerRow = Math.ceil(tilesetImage.width / tileSize);
  
  tilesData.forEach((row, y) => {
    row.forEach((symbol, x) => {
      if (symbol !== 0) {
        const tileIndex = symbol - 1;
        const srcX = Math.floor((tileIndex % tilesPerRow) * tileSize);
        const srcY = Math.floor(Math.floor(tileIndex / tilesPerRow) * tileSize);
        
        // Use Math.floor for position and Math.ceil for dimensions
        // This ensures no gaps between tiles when scaled
        context.drawImage(
          tilesetImage,
          srcX, srcY,
          tileSize, tileSize,
          Math.floor(x * tileSize * scale), 
          Math.floor(y * tileSize * scale),
          Math.ceil(tileSize * scale), 
          Math.ceil(tileSize * scale)
        );
      }
    });
  });
};

// MODIFIED: Updated renderStaticLayers function for proper map scaling
const renderStaticLayers = async () => {
  const offscreenCanvas = document.createElement('canvas');
  
  // Calculate the native map size in pixels
  const mapWidthInTiles = layersData.l_Collisions[0].length;
  const mapHeightInTiles = layersData.l_Collisions.length;
  const tileSize = 16; // Your tile size
  
  // Calculate the native map dimensions
  const nativeMapWidth = mapWidthInTiles * tileSize;
  const nativeMapHeight = mapHeightInTiles * tileSize;
  
  // Calculate scale based on canvas height for proper vertical fitting
  const scale = calculateOptimalScale(canvas.height, nativeMapHeight, dpr);
  
  console.log(`Map dimensions: ${nativeMapWidth}x${nativeMapHeight}px`);
  console.log(`Canvas dimensions: ${canvas.width/dpr}x${canvas.height/dpr}px`);
  console.log(`Applied scale factor: ${scale}`);
  
  // Set offscreen canvas dimensions using the scale - IMPORTANT
  const scaledWidth = Math.ceil(nativeMapWidth * scale);
  const scaledHeight = Math.ceil(nativeMapHeight * scale);
  
  offscreenCanvas.width = scaledWidth;
  offscreenCanvas.height = scaledHeight;
  
  const offscreenContext = offscreenCanvas.getContext('2d');
  
  // Enable crisp pixel art rendering
  offscreenContext.imageSmoothingEnabled = false;
  
  // Clear the canvas to a background color first
  offscreenContext.fillStyle = '#87CEEB'; // Light blue sky color
  offscreenContext.fillRect(0, 0, scaledWidth, scaledHeight);
  
  // Track loaded layers for debugging
  const loadedLayers = [];
  
  // Define which layers are static (not collectible)
  const staticLayers = [
    'l_BackgroundColor', 'l_Pines1', 'l_Pines2', 'l_Pines3', 'l_Pines4',
    'l_Platforms1', 'l_Platfroms2', 'l_Spikes', 'l_Collisions', 'l_Grass'
  ];
  
  // Only render static layers to the background canvas
  for (const layerName of staticLayers) {
    const tilesData = layersData[layerName];
    const tilesetInfo = tilesets[layerName];
    
    if (tilesetInfo && tilesData) {
      try {
        const tilesetImage = await loadImage(tilesetInfo.imageUrl);
        renderLayer(tilesData, tilesetImage, tilesetInfo.tileSize, offscreenContext, scale);
        loadedLayers.push(layerName);
      } catch (error) {
        console.error(`Failed to load image for layer ${layerName}:`, error);
      }
    }
  }
  
  // Now preload images for dynamic layers (coins and cans) for later use
  const dynamicLayerImages = {};
  const dynamicLayers = ['l_Coins', 'l_Cans'];
  
  for (const layerName of dynamicLayers) {
    const tilesetInfo = tilesets[layerName];
    if (tilesetInfo) {
      try {
        dynamicLayerImages[layerName] = await loadImage(tilesetInfo.imageUrl);
      } catch (error) {
        console.error(`Failed to preload image for dynamic layer ${layerName}:`, error);
      }
    }
  }
  
  console.log(`Successfully rendered static layers: ${loadedLayers.join(', ')}`);
  console.log(`Preloaded dynamic layer images for: ${Object.keys(dynamicLayerImages).join(', ')}`);
  
  return {
    canvas: offscreenCanvas,
    scale,
    dynamicLayerImages
  };
};

// New function to render dynamic layers (coins and cans) during animation loop
const renderDynamicLayers = (context, dynamicLayerImages, scale) => {
  // Define dynamic layers (collectible items)
  const dynamicLayers = ['l_Coins', 'l_Cans'];
  
  dynamicLayers.forEach(layerName => {
    const tilesData = layersData[layerName];
    const tilesetImage = dynamicLayerImages[layerName];
    const tileSize = tilesets[layerName].tileSize;
    
    if (!tilesetImage || !tilesData) return;
    
    const tilesPerRow = Math.ceil(tilesetImage.width / tileSize);
    
    // For coins and cans, we need to check if they've been collected
    const itemType = layerName === 'l_Coins' ? 'coin' : 'can';
    
    tilesData.forEach((row, y) => {
      row.forEach((symbol, x) => {
        // Only render items that haven't been collected
        if (symbol !== 0 && !gameStateManager.isItemCollected(itemType, x, y)) {
          const tileIndex = symbol - 1;
          const srcX = Math.floor((tileIndex % tilesPerRow) * tileSize);
          const srcY = Math.floor(Math.floor(tileIndex / tilesPerRow) * tileSize);
          
          context.drawImage(
            tilesetImage,
            srcX, srcY,
            tileSize, tileSize,
            Math.floor(x * tileSize * scale), 
            Math.floor(y * tileSize * scale),
            Math.ceil(tileSize * scale), 
            Math.ceil(tileSize * scale)
          );
        }
      });
    });
  });
};


// Initialize player
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

// MODIFIED: Updated animate function with better camera control
// Modify the animate function to include dynamic layer rendering
async function animate(backgroundCanvas, dynamicLayerImages) {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Limit deltaTime to prevent large jumps after tab switching, etc.
    const cappedDeltaTime = Math.min(deltaTime, 0.1);
    
    // Clear canvas with device pixel ratio scaling
    c.clearRect(0, 0, canvas.width, canvas.height);
    
    // Disable image smoothing for crisp pixel art
    c.imageSmoothingEnabled = false;

    // Always update timeManager - it will internally check if it should update based on game state
    timeManager.update(cappedDeltaTime);
    
    // Check for timeup game over condition - only in PLAYING state
    if (gameStateManager.currentState === gameStateManager.states.PLAYING) {
        // Game over on time out
        if (timeManager.remainingTime <= 0) {
            gameStateManager.changeState(gameStateManager.states.GAME_OVER);
        }
        
        // Level complete check - only check when in PLAYING state
        if (gameStateManager.areAllCoinsCollected()) {
            gameStateManager.changeState(gameStateManager.states.LEVEL_COMPLETE);
        }
    }
    
    // Only update gameplay elements when in PLAYING state
    if (gameStateManager.currentState === gameStateManager.states.PLAYING) {
        // Update camera before player to ensure proper following
        cameraController.update(player);
        
        // Update player position and state
        player.update(cappedDeltaTime, collisionBlocks, platforms);
        
        // Check item collisions only when playing
        player.checkItemCollisions(layersData.l_Coins, 'coin');
        player.checkItemCollisions(layersData.l_Cans, 'can');
        
        // Apply camera transform to context
        cameraController.applyTransform(c);
        
        // Draw static background map
        c.drawImage(backgroundCanvas, 0, 0);
        
        // Draw dynamic layers (coins and cans)
        renderDynamicLayers(c, dynamicLayerImages, cameraController.scale);
        
        // Draw player
        player.draw(c);
        
        // Reset transform before drawing UI
        cameraController.resetTransform(c);
    } else {
        // For non-playing states, we draw the appropriate screen
        gameRenderer.draw(c, gameStateManager.currentState);
    }
    
    // Always draw HUD - the HUD class will internally check if it should display based on game state
    hud.draw(c);

    // Continue the game loop
    requestAnimationFrame(() => animate(backgroundCanvas, dynamicLayerImages));
}


function checkAllCoinsCollected() {
    // Get total coin count from the layersData
    let totalCoins = 0;
    
    layersData.l_Coins.forEach(row => {
        row.forEach(tile => {
            if (tile !== 0) totalCoins++;
        });
    });
    
    // Compare with collected coins
    return gameStateManager.coins >= totalCoins && totalCoins > 0;
}

// MODIFIED START FUNCTION
// Modify the startGame function to pass dynamic layer images to animate
const startGame = async () => {
  try {
    console.log('Initializing game systems...');
    
    // Initialize systems
    await Promise.all([
      hud.init(),
      soundManager.init(),
      gameStateManager.init(),
      player.init()
    ]);
    
    console.log('Loading map...');
    
    // Get the map data, scale and dynamic images from renderStaticLayers
    const { canvas: backgroundCanvas, scale, dynamicLayerImages } = await renderStaticLayers();
    if (!backgroundCanvas) {
      console.error('Failed to create background canvas');
      return;
    }

    // Calculate actual map dimensions after scaling
    const mapWidth = layersData.l_Collisions[0].length * 16;
    const mapHeight = layersData.l_Collisions.length * 16;
    const scaledMapWidth = mapWidth * scale;
    const scaledMapHeight = mapHeight * scale;
    
    console.log(`Native map dimensions: ${mapWidth}x${mapHeight}px`);
    console.log(`Scaled map dimensions: ${scaledMapWidth}x${scaledMapHeight}px`);

    // Initialize camera with the scaled map dimensions
    cameraController.init(scaledMapWidth, scaledMapHeight, scale);
    
    console.log('Starting game loop...');
    
    // Initialize time tracking for game loop
    lastTime = performance.now();
    
    // Set initial game state - ensures timer won't start until state changes to PLAYING
    gameStateManager.changeState(gameStateManager.states.INTRO);
    
    // Start game loop with dynamic layer images
    animate(backgroundCanvas, dynamicLayerImages);
    
    // Add input handling for starting game from intro
    document.addEventListener('keydown', (e) => {
        // Handle state changes based on key press
        if (gameStateManager.currentState === gameStateManager.states.INTRO) {
            gameStateManager.changeState(gameStateManager.states.PLAYING);
        } else if (gameStateManager.currentState === gameStateManager.states.PAUSED && e.key === 'Enter') {
            gameStateManager.changeState(gameStateManager.states.PLAYING);
        } else if (e.key === 'Escape' && gameStateManager.currentState === gameStateManager.states.PLAYING) {
            gameStateManager.changeState(gameStateManager.states.PAUSED);
        } else if ((gameStateManager.currentState === gameStateManager.states.LEVEL_COMPLETE || 
                  gameStateManager.currentState === gameStateManager.states.GAME_OVER) &&
                  gameStateManager.waitingForKeypress) {
            gameStateManager.changeState(gameStateManager.states.INTRO);
        }
    });
    
    console.log('Game successfully initialized!');
    
  } catch (error) {
    console.error('Game initialization failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
};

// Start the game
startGame();

// ./classes/GameStateManager.js
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

// ./classes/TimeManager.js
class TimeManager {
    constructor() {
        this.deltaTime = 0;
        this.lastTime = performance.now();
        this.gameTime = 0; // Total elapsed game time in seconds
        this.isPaused = false;
        this.callbacks = {}; // For timed events
        this.callbackId = 0;
        
        // Timer for level countdown
        this.levelTime = 180; // 3 minutes in seconds
        this.remainingTime = this.levelTime;
    }

    // Replace the current update() method with this improved version:
    update(deltaTime) {
        // Only update time when game is in PLAYING state
        if (this.isPaused || (gameStateManager && gameStateManager.currentState !== gameStateManager.states.PLAYING)) {
            return;
        }
        
        this.deltaTime = deltaTime;
        this.gameTime += this.deltaTime;
        
        // Update level timer
        this.remainingTime = Math.max(0, this.levelTime - this.gameTime);
        
        // Process callbacks
        this._processCallbacks();
    }
        
    // Get formatted time as MM:SS
    getFormattedTime() {
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = Math.floor(this.remainingTime % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    pause() {
        this.isPaused = true;
    }
    
    resume() {
        this.isPaused = false;
        this.lastTime = performance.now(); // Reset lastTime to prevent big jumps
    }
    
    reset() {
        this.gameTime = 0;
        this.remainingTime = this.levelTime;
        this.lastTime = performance.now();
        this.isPaused = false;
    }
    
    // Add a callback to be executed after a delay
    setTimeout(callback, delay) {
        const id = this.callbackId++;
        this.callbacks[id] = {
            callback,
            triggerTime: this.gameTime + delay,
            repeat: false
        };
        return id;
    }
    
    // Add a callback to be executed repeatedly
    setInterval(callback, interval) {
        const id = this.callbackId++;
        this.callbacks[id] = {
            callback,
            triggerTime: this.gameTime + interval,
            interval,
            repeat: true
        };
        return id;
    }
    
    // Remove a callback
    clearTimeout(id) {
        delete this.callbacks[id];
    }
    
    _processCallbacks() {
        Object.keys(this.callbacks).forEach(id => {
            const callback = this.callbacks[id];
            if (this.gameTime >= callback.triggerTime) {
                callback.callback();
                
                if (callback.repeat) {
                    callback.triggerTime = this.gameTime + callback.interval;
                } else {
                    delete this.callbacks[id];
                }
            }
        });
    }
}

// ./classes/CameraController.js
// Fix for the CameraController class to properly clamp and scale with the canvas

class CameraController {
  constructor(canvas, dpr) {
    this.canvas = canvas;
    this.dpr = dpr || 1;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.smoothing = 0.1; // Lower = smoother camera
    this.mapWidth = 0;
    this.mapHeight = 0;
    this.scale = 1;
    this.viewWidth = canvas.width / dpr;
    this.viewHeight = canvas.height / dpr;
  }

  init(mapWidth, mapHeight, scale) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.scale = scale;
    // Viewable area dimensions (accounting for DPR)
    this.viewWidth = this.canvas.width / this.dpr;
    this.viewHeight = this.canvas.height / this.dpr;
    
    console.log(`Camera initialized with:`, {
      mapWidth: this.mapWidth,
      mapHeight: this.mapHeight,
      scale: this.scale,
      viewWidth: this.viewWidth,
      viewHeight: this.viewHeight
    });
  }

  update(target) {
    if (!target) return;
    
    // Player is centered horizontally except near map edges
    this.targetX = (target.x + target.width / 2) * this.scale - this.viewWidth / 2;
    
    // Player is positioned slightly below center vertically
    const verticalOffset = this.viewHeight * 0.4; // Position player at 40% from top
    this.targetY = (target.y + target.height / 2) * this.scale - verticalOffset;
    
    // Apply camera smoothing
    this.x += (this.targetX - this.x) * this.smoothing;
    this.y += (this.targetY - this.y) * this.smoothing;
    
    // Clamp to map boundaries - this is the key fix
    this.x = Math.max(0, Math.min(this.x, this.mapWidth - this.viewWidth));
    this.y = Math.max(0, Math.min(this.y, this.mapHeight - this.viewHeight));
  }

  applyTransform(ctx) {
    ctx.save();
    // Use Math.round to ensure pixel-perfect positioning
    ctx.translate(-Math.round(this.x), -Math.round(this.y));
  }

  resetTransform(ctx) {
    ctx.restore();
  }

  // Helper method to convert world coordinates to screen coordinates
  worldToScreen(x, y) {
    return {
      x: x * this.scale - this.x,
      y: y * this.scale - this.y
    };
  }

  // Helper method to convert screen coordinates to world coordinates
  screenToWorld(x, y) {
    return {
      x: (x + this.x) / this.scale,
      y: (y + this.y) / this.scale
    };
  }
}

// ./index.html

<!DOCTYPE html>
<html>
<head>
    <link rel="icon" href="data:,"> <!-- Empty favicon to prevent 404 -->
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    <title>2D Platformer</title>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    
    <!-- Utils -->
    <script src="./js/utils.js"></script>

    <!-- Core Systems -->
    <script src="./classes/TimeManager.js"></script>
    <script src="./classes/SoundManager.js"></script>
    <script src="./classes/GameStateManager.js"></script>

    <!-- Other Classes -->
    <script src="./classes/AnimationController.js"></script>
    <script src="./classes/CameraController.js"></script>
    <script src="./classes/CollisionBlock.js"></script>
    <script src="./classes/Player.js"></script>
    <script src="./classes/Platform.js"></script>
    <script src="./classes/GameRenderer.js"></script>
    <script src="./classes/HUD.js"></script>

    <!-- Layer Data -->
    <script src="./data/l_BackgroundColor.js"></script>
    <script src="./data/l_Pines1.js"></script>
    <script src="./data/l_Pines2.js"></script>
    <script src="./data/l_Pines3.js"></script>
    <script src="./data/l_Pines4.js"></script>
    <script src="./data/l_Platforms1.js"></script>
    <script src="./data/l_Platfroms2.js"></script>
    <script src="./data/l_Spikes.js"></script>
    <script src="./data/l_Collisions.js"></script>
    <script src="./data/l_Grass.js"></script>
    <script src="./data/l_Coins.js"></script>
    <script src="./data/l_Cans.js"></script>
    <script src="./data/collisions.js"></script>
    
    <!-- Main Game Code -->
    <script src="./js/eventListeners.js"></script>
    <script src="./js/index.js"></script>

</body>
</html>



