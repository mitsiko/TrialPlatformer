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