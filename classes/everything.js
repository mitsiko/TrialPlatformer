// ./classes/GameStateManager.js - Handle game state transitions and logic

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
    }
    
    startGame() {
        if (this.currentState === this.states.INTRO || 
            this.currentState === this.states.PAUSED) {
            this.changeState(this.states.PLAYING);
        }
    }
    
    init() {
        this.reset();
    }
    
    reset() {
        this.changeState(this.states.INTRO);
    }
    
    changeState(newState) {
        const oldState = this.currentState;
        this.currentState = newState;
        this.stateEnteredTime = timeManager.gameTime;
        
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
                break;
                
            case this.states.PLAYING:
                timeManager.resume();
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
                timeManager.setTimeout(() => this.changeState(this.states.INTRO), 3);
                break;
                
            case this.states.GAME_OVER:
                soundManager.playMusic('gameOver');
                timeManager.setTimeout(() => this.changeState(this.states.INTRO), 8);
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

// ./classes/GameRenderer.js - Handles rendering game states and UI

class GameRenderer {
    constructor() {
        this.offscreenCanvas = null;
        this.splashImage = null;
    }
    
    async init() {
        // We don't need to load splash images as we're rendering directly
    }
    
    draw(context, state) {
        switch (state) {
            case gameStateManager.states.INTRO:
                this.drawIntroScreen(context);
                break;
                
            case gameStateManager.states.PLAYING:
                // Main gameplay rendering happens in game loop
                break;
                
            case gameStateManager.states.PAUSED:
                this.drawPausedScreen(context);
                break;
                
            case gameStateManager.states.LEVEL_COMPLETE:
                this.drawLevelCompleteScreen(context);
                break;
                
            case gameStateManager.states.GAME_OVER:
                this.drawGameOverScreen(context);
                break;
        }
    }
    
    drawIntroScreen(context) {
        // Save current state
        context.save();
        
        // Clear and scale for device pixel ratio
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        // Fill black background
        context.fillStyle = '#1a261f';
        context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        
        // Draw title text
        context.fillStyle = '#FFFDD0'; // Cream color
        context.font = '48px monospace';
        context.textAlign = 'center';
        
        // Draw title
        context.fillText(
            'The Leftovers',
            canvas.width / dpr / 2,
            canvas.height / dpr / 2
        );
        
        // Draw "Press any key" text (flashing)
        const stateTime = gameStateManager.getStateTime();
        if (stateTime > 2 && Math.floor(stateTime * 2) % 2 === 0) {
            context.font = '24px monospace';
            context.fillText(
                'Press any key to continue',
                canvas.width / dpr / 2,
                canvas.height / dpr / 2 + 60
            );
        }
        
        // Restore context state
        context.restore();
    }
    
    drawPausedScreen(context) {
        // Save current state
        context.save();
        
        // Set transform for UI elements
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        // Draw semi-transparent overlay
        context.fillStyle = '#1a261f';
        context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        
        // Draw "Paused" text
        context.fillStyle = '#FFFDD0'; // Cream color
        context.font = '48px monospace';
        context.textAlign = 'center';
        
        context.fillText(
            'Paused',
            canvas.width / dpr / 2,
            canvas.height / dpr / 2
        );
        
        // Draw "Press enter to continue" text
        context.font = '24px monospace';
        context.fillText(
            'Press enter to continue',
            canvas.width / dpr / 2,
            canvas.height / dpr / 2 + 60
        );
        
        // Restore context state
        context.restore();
    }
    
    drawLevelCompleteScreen(context) {
        // Save current state
        context.save();
        
        // Clear and scale for device pixel ratio
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        // Fill black background
        context.fillStyle = '#1a261f';
        context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        
        // Draw completion text
        context.fillStyle = '#FFFDD0'; // Cream color
        context.font = '48px monospace';
        context.textAlign = 'center';
        
        context.fillText(
            'Level 1 Passed',
            canvas.width / dpr / 2,
            canvas.height / dpr / 2
        );
        
        // Restore context state
        context.restore();
    }
    
    drawGameOverScreen(context) {
        // Save current state
        context.save();
        
        // Clear and scale for device pixel ratio
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        // Fill black background
        context.fillStyle = '#1a261f';
        context.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        
        // Draw game over text
        context.fillStyle = '#FFFDD0'; // Cream color
        context.font = '48px monospace';
        context.textAlign = 'center';
        
        context.fillText(
            'Game Over',
            canvas.width / dpr / 2,
            canvas.height / dpr / 2
        );
        
        // Restore context state
        context.restore();
    }
}

// ./classes/HUD.js - Heads-up display renderin

class HUD {
  constructor() {
    this.lifeIcon = null;
    this.coinIcon = null;
    this.canIcon = null;
    this.timerIcon = null;
    this.initialized = false;
    
    // Font settings
    this.fontFamily = 'monospace'; // Use monospace as a pixel font alternative
    this.fontSize = 16;
    this.fontColor = '#FFFFFF'; // Cream color
  }
  
  async init() {
    try {
      // Load HUD icons
      this.lifeIcon = await loadImage('images/lifeFlag.png');
      this.coinIcon = await loadImage('images/CoinSprite.png');
      this.canIcon = await loadImage('images/CanSprite.png');
      this.timerIcon = await loadImage('images/timerSprite.png');
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load HUD icons:', error);
    }
  }
  
  draw(context) {
    if (!this.initialized) return;
    
    // Save current context state
    context.save();
    
    // Reset transformations to draw directly on screen
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // Set font style
    context.font = `${this.fontSize}px ${this.fontFamily}`;
    context.fillStyle = this.fontColor;
    
    // Draw lives (top-left)
    this.drawLives(context);
    
    // Draw coins and cans counter
    this.drawCoins(context);
    this.drawCans(context);
    
    // Draw timer (top-right)
    this.drawTimer(context);
    
    // Restore context state
    context.restore();
  }
  
  drawLives(context) {
    const lives = gameStateManager.lives;
    const iconSize = 16;
    const spacing = 8;
    const startX = 16;
    const startY = 16;
    
    for (let i = 0; i < lives; i++) {
      context.drawImage(
        this.lifeIcon,
        startX + i * (iconSize + spacing),
        startY,
        iconSize,
        iconSize
      );
    }
  }
  
  drawCoins(context) {
    const coins = gameStateManager.coins;
    const iconSize = 16;
    const startX = 16;
    const startY = 48; // Below lives
    
    // Draw coin icon
    context.drawImage(
      this.coinIcon,
      startX,
      startY,
      iconSize,
      iconSize
    );
    
    // Draw coin count
    context.fillText(`x ${coins}`, startX + iconSize + 5, startY + iconSize - 2);
  }
  
  drawCans(context) {
    const cans = gameStateManager.cans;
    const iconSize = 16;
    const startX = 16;
    const startY = 72; // Below coins
    
    // Draw can icon
    context.drawImage(
      this.canIcon,
      startX,
      startY,
      iconSize,
      iconSize
    );
    
    // Draw can count
    context.fillText(`x ${cans}`, startX + iconSize + 5, startY + iconSize - 2);
  }
  
  drawTimer(context) {
    const timerText = timeManager.getFormattedTime();
    const iconSize = 16;
    const startX = canvas.width / dpr - 84;
    const startY = 16;
    
    // Draw timer icon
    context.drawImage(
      this.timerIcon,
      startX,
      startY,
      iconSize,
      iconSize
    );
    
    // Draw timer text
    context.fillText(timerText, startX + iconSize + 5, startY + iconSize - 2);
  }
}

// ./classes/SoundManager.js - Handle all game sounds and music

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
    this.loadSound('landing', 'sounds/landingTrimmed.mp3');
    
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

// ./classes/TimeManager.js - A centralized timing system for the game

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

    update(deltaTime) {
        if (this.isPaused) return;
        
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

// ./js/index.js

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

    // Always update these systems regardless of game state
    timeManager.update(cappedDeltaTime);
    
    // Check for timeup game over condition
    if (gameStateManager.currentState === gameStateManager.states.PLAYING &&
        timeManager.remainingTime <= 0) {
        gameStateManager.changeState(gameStateManager.states.GAME_OVER);
    }
    
    // Check for level complete condition (all coins collected)
    if (gameStateManager.currentState === gameStateManager.states.PLAYING && 
        checkAllCoinsCollected()) {
        gameStateManager.changeState(gameStateManager.states.LEVEL_COMPLETE);
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
    
    // Always draw HUD (not affected by camera)
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
    // This is crucial for proper boundary clamping
    cameraController.init(scaledMapWidth, scaledMapHeight, scale);
    
    console.log('Starting game loop...');
    
    // Initialize time tracking for game loop
    lastTime = performance.now();
    
    // Start game loop with dynamic layer images
    animate(backgroundCanvas, dynamicLayerImages);
    
    // Set initial game state
    gameStateManager.changeState(gameStateManager.states.INTRO);

    document.addEventListener('keydown', (e) => {
        if (gameStateManager.currentState === gameStateManager.states.INTRO) {
            gameStateManager.changeState(gameStateManager.states.PLAYING);
            soundManager.playMusic('intro');
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

// ./js/eventListeners.js

// ./js/eventListeners.js
console.log("Initializing event listeners...");

// Replace the keydown event listener
window.removeEventListener('keydown', window.keydownListener);
window.keydownListener = (event) => {
    // Allow any key to start game from intro
    if (gameStateManager && gameStateManager.currentState === gameStateManager.states.INTRO) {
        gameStateManager.startGame();
        return;
    }
    
    switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            if (gameStateManager && gameStateManager.currentState !== gameStateManager.states.PLAYING) {
                return;
            }
            
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
            if (gameStateManager && gameStateManager.currentState !== gameStateManager.states.PLAYING) {
                return;
            }
            
            console.log("Moving LEFT");
            keys.a.pressed = true;
            break;
            
        case 'd':
        case 'arrowright':
            if (gameStateManager && gameStateManager.currentState !== gameStateManager.states.PLAYING) {
                return;
            }
            
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
};
window.addEventListener('keydown', window.keydownListener);

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
