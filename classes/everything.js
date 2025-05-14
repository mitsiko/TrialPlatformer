// ./classes/AnimationController.js - Handles sprite animations for the player
class AnimationController {
  constructor() {
    this.animations = {};
    this.currentAnimation = null;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.frameDuration = 0.1; // Default: 100ms per frame
    this.isPlaying = false;
    this.isLooping = true;
    this.flipped = false; // For facing direction
    this.initialized = false;
    
    // Animation finished callback
    this.onAnimationComplete = null;
  }
  
  async init() {
    // Load all player animations
    await this.loadAnimation('idle', 'images/idle.png', 1, 32, 32);
    await this.loadAnimation('running', 'images/running.png', 8, 32, 32);
    await this.loadAnimation('jumping', 'images/jumping.png', 3, 40, 40);
    await this.loadAnimation('falling', 'images/falling.png', 1, 40, 40);
    await this.loadAnimation('landing', 'images/landing.png', 5, 40, 40); // 5 frames, 40x40px
    await this.loadAnimation('death', 'images/death.png', 1, 32, 32);
    
    this.initialized = true;
    
    // Start with idle animation
    this.play('idle', true);
  }
  
  async loadAnimation(name, spriteSheetPath, frameCount, frameWidth, frameHeight) {
    return new Promise((resolve, reject) => {
      const spriteSheet = new Image();
      spriteSheet.onload = () => {
        this.animations[name] = {
          spriteSheet,
          frameCount,
          frameWidth,
          frameHeight,
          frames: []
        };
        
        // Create array of frame data
        for (let i = 0; i < frameCount; i++) {
          this.animations[name].frames.push({
            x: i * frameWidth,
            y: 0,
            width: frameWidth,
            height: frameHeight
          });
        }
        
        resolve();
      };
      
      spriteSheet.onerror = () => {
        console.error(`Failed to load animation: ${name}`);
        reject();
      };
      
      spriteSheet.src = spriteSheetPath;
    });
  }
  
  // Modify the play() method to ensure callbacks fire:
  play(animationName, loop = true, frameRate = 0.1, callback = null) {
    if (!this.animations[animationName]) return;
    
    // Always restart animation if it's not looping
    if (this.currentAnimation !== animationName || !loop) {
      this.currentAnimation = animationName;
      this.currentFrame = 0;
      this.frameTimer = 0;
      this.isPlaying = true;
      this.isLooping = loop;
      this.frameDuration = frameRate;
      this.onAnimationComplete = callback || function() {};
    }
  }

  isComplete() {
    if (!this.currentAnimation || !this.animations[this.currentAnimation]) return false;
    const animation = this.animations[this.currentAnimation];
    return !this.isLooping && this.currentFrame >= animation.frameCount - 1;
  }

  // And modify the update() method:
  update(deltaTime) {
    if (!this.isPlaying || !this.currentAnimation) return;
    
    const animation = this.animations[this.currentAnimation];
    this.frameTimer += deltaTime;
    
    if (this.frameTimer >= this.frameDuration) {
      this.frameTimer = 0;
      this.currentFrame++;
      
      if (this.currentFrame >= animation.frameCount) {
        if (this.isLooping) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = animation.frameCount - 1;
          this.isPlaying = false;
          if (this.onAnimationComplete) {
            this.onAnimationComplete(); // Ensure this gets called
          }
        }
      }
    }
  }
    
  draw(context, x, y) {
    if (!this.initialized || !this.currentAnimation) return;
    
    const animation = this.animations[this.currentAnimation];
    if (!animation) return;
    
    const frame = animation.frames[this.currentFrame];
    
    context.save();
    
    // Handle flipping for direction
    if (this.flipped) {
      context.translate(x + animation.frameWidth / 2, y);
      context.scale(-1, 1);
      x = -animation.frameWidth / 2;
    }
    
    // Adjust y position to account for different sprite heights
    // The origin is bottom-center of the sprite
    const yOffset = animation.frameHeight - 32; // Adjust based on standard height of 32px
    
    context.drawImage(
      animation.spriteSheet,
      frame.x, frame.y, frame.width, frame.height,
      x, y - yOffset, frame.width, frame.height
    );
    
    context.restore();
  }
  
  // Set the horizontal flip state based on direction
  setDirection(direction) {
    // direction: 1 for right, -1 for left
    this.flipped = direction < 0;
  }
  
  // Check if an animation has completed (for non-looping animations)
  isComplete() {
    if (this.isLooping) return false;
    
    const animation = this.animations[this.currentAnimation];
    return !this.isPlaying && this.currentFrame === animation.frameCount - 1;
  }
  
  // Force complete the current animation
  forceComplete() {
    if (!this.currentAnimation) return;
    
    const animation = this.animations[this.currentAnimation];
    this.currentFrame = animation.frameCount - 1;
    this.isPlaying = false;
    
    if (this.onAnimationComplete) {
      this.onAnimationComplete();
    }
  }
}

// ./classes/CameraControlller.js
class CameraController {
  constructor(canvas, dpr) {
    this.x = 0;
    this.y = 0;
    this.width = canvas.width / dpr;
    this.height = canvas.height / dpr;
    
    // Camera center threshold values
    this.centerX = 320; // Horizontal center threshold
    this.centerY = 170; // Vertical center threshold
    
    // Map bounds (should be set after map is loaded)
    this.mapWidth = 0;
    this.mapHeight = 0;
    
    // Smoothing factor (0 = instant, 1 = no movement)
    this.smoothing = 0.1;
  }
  
  init(mapWidth, mapHeight) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
  }
  
  update(player) {
    // Calculate target position (where the camera wants to be)
    let targetX = player.x - this.centerX;
    let targetY = player.y - this.centerY;
    
    // Apply smoothing using lerp
    if (this.smoothing > 0) {
      this.x += (targetX - this.x) * (1 - this.smoothing);
      this.y += (targetY - this.y) * (1 - this.smoothing);
    } else {
      this.x = targetX;
      this.y = targetY;
    }
    
    // Clamp to map bounds
    this.x = Math.max(0, Math.min(this.x, this.mapWidth - this.width));
    this.y = Math.max(0, Math.min(this.y, this.mapHeight - this.height));
  }
  
  // Apply camera transformation to context
  applyTransform(context) {
    context.save();
    context.translate(-Math.floor(this.x), -Math.floor(this.y));
  }
  
  // Restore context transformation
  resetTransform(context) {
    context.restore();
  }
  
  // Convert world coordinates to screen coordinates
  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.x,
      y: worldY - this.y
    };
  }
  
  // Convert screen coordinates to world coordinates
  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this.x,
      y: screenY + this.y
    };
  }
  
  // Check if a world coordinate is visible on screen
  isVisible(worldX, worldY, width = 0, height = 0) {
    return (
      worldX + width >= this.x &&
      worldX <= this.x + this.width &&
      worldY + height >= this.y &&
      worldY <= this.y + this.height
    );
  }
}
// ./classes/CollisionBlock.js
class CollisionBlock {
  constructor({ x, y, size }) {
    this.x = x
    this.y = y
    this.width = size
    this.height = size
  }

  draw(c) {
    // Optional: Draw collision blocks for debugging
    c.fillStyle = 'rgba(255, 0, 0, 0.5)'
    c.fillRect(this.x, this.y, this.width, this.height)
  }
}

// ./classes/GameRenderer.js
// GameRenderer.js - Handles rendering game states and UI
class GameRenderer {
  constructor() {
    this.offscreenCanvas = null;
    this.splashImage = null;
  }
  
  async init() {
    // Load splash screen background if needed
    // this.splashImage = await loadImage('images/splashBackground.png');
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
    context.fillStyle = '#000000';
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
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
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
    context.fillStyle = '#000000';
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
    context.fillStyle = '#000000';
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

// ./classes/GameStateManager.js
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

// ./classes/HUD.js
// HUD.js - Heads-up display rendering
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
    const startX = 10;
    const startY = 10;
    
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
    const startX = 10;
    const startY = 36; // Below lives
    
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
    const startX = 10;
    const startY = 62; // Below coins
    
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
    const startX = canvas.width / dpr - 110;
    const startY = 10;
    
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

// ./classes/Platform.js
class Platform {
  constructor({ x, y, width = 16, height = 4 }) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  draw(c) {
    c.fillStyle = 'rgba(255, 0, 0, 0.5)'
    c.fillRect(this.x, this.y, this.width, this.height)
  }
  
  checkCollision(player, deltaTime) {
    return (
      player.y + player.height <= this.y &&
      player.y + player.height + player.velocity.y * deltaTime >= this.y &&
      player.x + player.width > this.x &&
      player.x < this.x + this.width
    )
  }
}

// ./classes/Player.js
// Updated Player.js with animation and movement states
const X_VELOCITY = 180;       // Reduced from 200 for better control
const JUMP_POWER = 400;       // Increased from 250 for better feel
const VERTICAL_HOP_POWER = 180; // Smaller jump for vertical hops
const GRAVITY = 900;          // Increased from 580 for snappier falls
const SKID_DECELERATION = 20; // Add this new constant
const INVINCIBILITY_TIME = 3; // Seconds of invincibility after taking damage
const FALL_DAMAGE_HEIGHT = 3; // Multiple of player height for fall damage

class Player {
    constructor({ x = 0, y = 0, size = 32, velocity = { x: 0, y: 0 } } = {}) {
    this.x = x
    this.y = y
    this.width = size
    this.height = size  
    this.velocity = velocity; // Now properly initialized
    this.isOnGround = false;

    
    this.direction = 1; // 1 for right, -1 for left
    
    // Movement state
    this.movementState = 'idle'; // idle, running, jumping, falling, landing, death
    this.canJump = true;
    this.canMove = true;
    this.inputLocked = false;  // For hop and landing animations
    
    // Fall damage tracking
    this.fallStartY = 0;
    this.isFalling = false;
    
    // Invincibility (for damage)
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.blinkTimer = 0;
    this.isVisible = true;
    
    // Create animation controller
    this.animation = new AnimationController();
    
    // Initialize animation states
    this.animation.init();
  

    // Updated collision properties
    this.collisionOffset = {
      x: size * 0.15,  // 15% from left
      y: size * 0.1    // 10% from top
    };
    this.collisionSize = {
      width: size * 0.7,
      height: size * 0.9  // 90% of player height
    };
  }


  draw(c) {
    if (this.isInvincible && !this.isVisible) return;
    
    // Calculate actual draw position
    const drawX = this.x + this.width/2;
    const drawY = this.y + this.height; // Anchor at feet
    
    // Draw animation centered horizontally
    this.animation.draw(c, drawX, drawY);
    
    // DEBUG: Draw collision box
    c.fillStyle = 'rgba(255, 0, 0, 0.3)';
    c.fillRect(
      this.x + this.collisionOffset.x,
      this.y + this.collisionOffset.y,
      this.collisionSize.width,
      this.collisionSize.height
    );

    // DEBUG: Draw feet position
    c.fillStyle = 'blue';
    c.fillRect(
      this.x + this.collisionOffset.x + this.collisionSize.width/2 - 2,
      this.y + this.collisionOffset.y + this.collisionSize.height - 2,
      4, 4
    );

    // DEBUG: Draw center point
    c.fillStyle = 'green';
    c.fillRect(
      this.x + this.width/2 - 2,
      this.y + this.height/2 - 2,
      4, 4
    );
  }

  update(deltaTime, collisionBlocks, platforms) {
    if (!deltaTime) return;

    // Update animation first
    this.animation.update(deltaTime);

    // Update invincibility state
    this.updateInvincibility(deltaTime);

    // Apply gravity if not grounded
    if (!this.isOnGround) {
      this.applyGravity(deltaTime);
      if (this.velocity.y > 500) this.velocity.y = 500;
    }

    // Only process movement if not in death state
    if (this.movementState !== 'death') {
      // Update fall tracking
      this.updateFallTracking();
      
      // Handle input if not locked
      if (!this.inputLocked) {
        this.handleInput(keys);
      }

      // Update horizontal position and check collisions
      this.x += this.velocity.x * deltaTime;
      this.checkForHorizontalCollisions(collisionBlocks);

      // Check platform collisions
      this.checkPlatformCollisions(platforms, deltaTime);

      // Update vertical position and check collisions
      this.y += this.velocity.y * deltaTime;
      this.checkForVerticalCollisions(collisionBlocks);

      // Check bounds
      if (this.y > canvas.height / dpr + 40) {
        this.die();
      }

      // Update movement state
      this.updateMovementState();
    }
  }
  updateInvincibility(deltaTime) {
    if (this.isInvincible) {
      this.invincibilityTimer += deltaTime;
      
      // Blink effect (toggle visibility every 0.1 seconds)
      this.blinkTimer += deltaTime;
      if (this.blinkTimer >= 0.1) {
        this.blinkTimer = 0;
        this.isVisible = !this.isVisible;
      }
      
      // End invincibility after timer expires
      if (this.invincibilityTimer >= INVINCIBILITY_TIME) {
        this.isInvincible = false;
        this.isVisible = true;
      }
    }
  }
  
  updateFallTracking() {
    // Start tracking fall if moving downward and not on ground
    if (this.velocity.y > 0 && !this.isOnGround && !this.isFalling) {
      this.fallStartY = this.y;
      this.isFalling = true;
    }
    
    // Check for landing after a fall
    if (this.isFalling && this.isOnGround) {
      const fallDistance = this.y - this.fallStartY;
      
      // Check if fall is high enough for damage
      if (fallDistance > this.height * FALL_DAMAGE_HEIGHT) {
        this.takeDamage();
      }
      
      this.isFalling = false;
      
      // Trigger landing animation if falling (not from a jump)
      if (this.movementState === 'falling') {
        this.land();
      }
    }
  }

  jump() {
    if (this.isOnGround && this.canJump && !this.inputLocked) {
      this.velocity.y = -JUMP_POWER;
      this.isOnGround = false;
      this.canJump = false;
      this.movementState = 'jumping';
      
      // Play jump animation (non-looping)
      this.animation.play('jumping', false, 0.1, () => {
        // When jump animation completes, transition to falling
        this.animation.play('falling', true);
      });
      
      soundManager.playSound('jump');
    }
  }
  
  verticalHop() {
    if (this.isOnGround && this.canJump && !this.inputLocked) {
      this.velocity.y = -VERTICAL_HOP_POWER;
      this.isOnGround = false;
      this.canJump = false;
      this.inputLocked = true; // Lock controls during hop
      this.movementState = 'falling'; // Use falling state for hop
      
      // Play falling animation for the hop
      this.animation.play('falling', true);
      
      soundManager.playSound('jump');
    }
  }
    
  land() {
      // Only proceed if we're actually grounded
      if (!this.isOnGround) {
          console.warn("Prevented landing while not grounded");
          return;
      }

      console.log("Proper landing detected");
      this.movementState = 'landing';
      this.inputLocked = true;
      
      this.animation.play('landing', false, 0.08, () => {
          this.inputLocked = false; // Unlock controls when animation completes
          
          // Immediately check current input state
          if (keys.a.pressed || keys.d.pressed) {
              this.movementState = 'running';
              this.animation.play('running', true);
          } else {
              this.movementState = 'idle';
              this.animation.play('idle', true);
          }
      });
  }
  takeDamage() {
    // Skip if already invincible
    if (this.isInvincible) return;
    
    // Remove a life
    gameStateManager.removeLife();
    
    // Start invincibility
    this.isInvincible = true;
    this.invincibilityTimer = 0;
    
    // If player is still alive, make them invincible temporarily
    if (gameStateManager.lives > 0) {
      this.isInvincible = true;
      this.invincibilityTimer = 0;
    } else {
      this.die();
    }
  }
  
  die() {
    this.movementState = 'death';
    this.inputLocked = true;
    this.canJump = false;
    this.velocity = { x: 0, y: 0 };
    
    // Play death animation
    this.animation.play('death', true);
    
    // Transition to game over state after a delay
    timeManager.setTimeout(() => {
      gameStateManager.changeState(gameStateManager.states.GAME_OVER);
    }, 3);
  }

  updateHorizontalPosition(deltaTime) {
    this.x += this.velocity.x * deltaTime;
  }

  updateVerticalPosition(deltaTime) {
    this.y += this.velocity.y * deltaTime;
  }

  applyGravity(deltaTime) {
    this.velocity.y += GRAVITY * deltaTime;
  }

  handleInput(keys) {
      console.log("Handling input - Current keys state:", keys);
      
      if (this.inputLocked) {
          console.log("Input locked - ignoring");
          return;
      }

      // Reset horizontal velocity
      this.velocity.x = 0;

      if (keys.a.pressed) {
          console.log("Applying LEFT movement");
          this.velocity.x = -X_VELOCITY;
          this.direction = -1;
          this.animation.setDirection(-1);
          
          // Immediately update state if grounded
          if (this.isOnGround && this.movementState !== 'running') {
              this.movementState = 'running';
              this.animation.play('running', true);
          }
      } else if (keys.d.pressed) {
          console.log("Applying RIGHT movement");
          this.velocity.x = X_VELOCITY;
          this.direction = 1;
          this.animation.setDirection(1);
          
          // Immediately update state if grounded
          if (this.isOnGround && this.movementState !== 'running') {
              this.movementState = 'running';
              this.animation.play('running', true);
          }
      } else if (this.isOnGround && this.movementState !== 'idle') {
          // If no movement keys pressed and grounded
          this.movementState = 'idle';
          this.animation.play('idle', true);
      }
      
      console.log("Final velocity:", this.velocity);
  }
  
  updateMovementState() {
      // Skip if in special states that handle their own transitions
      if (this.movementState === 'death') return;

      // If we're landing, don't override the state
      if (this.movementState === 'landing') return;

      // Airborne states
      if (!this.isOnGround) {
          if (this.velocity.y < 0) {
              if (this.movementState !== 'jumping') {
                  this.movementState = 'jumping';
                  this.animation.play('jumping', false);
              }
          } else {
              if (this.movementState !== 'falling') {
                  this.movementState = 'falling';
                  this.animation.play('falling', true);
              }
          }
          return;
      }

      // Grounded states
      if (this.velocity.x !== 0) {
          if (this.movementState !== 'running') {
              this.movementState = 'running';
              this.animation.play('running', true);
          }
      } else {
          if (this.movementState !== 'idle') {
              this.movementState = 'idle';
              this.animation.play('idle', true);
          }
      }
  }

  checkForHorizontalCollisions(collisionBlocks) {
    const buffer = 0.0001;
    const collisionBox = {
      x: this.x + this.collisionOffset.x,
      y: this.y + this.collisionOffset.y,
      width: this.collisionSize.width,
      height: this.collisionSize.height
    };

    for (let block of collisionBlocks) {
      if (this.isColliding(collisionBox, block)) {
        // Left collision
        if (this.velocity.x < 0) {
          this.x = block.x + block.width - this.collisionOffset.x + buffer;
        }
        // Right collision
        else if (this.velocity.x > 0) {
          this.x = block.x - this.collisionSize.width - this.collisionOffset.x - buffer;
        }
        break;
      }
    }
  }

  checkForVerticalCollisions(collisionBlocks) {
    const buffer = 0.0001;
    let wasInAir = !this.isOnGround;
    this.isOnGround = false;

    const collisionBox = {
      x: this.x + this.collisionOffset.x,
      y: this.y + this.collisionOffset.y,
      width: this.collisionSize.width,
      height: this.collisionSize.height
    };

    for (let block of collisionBlocks) {
      if (this.isColliding(collisionBox, block)) {
        // Head collision (from below)
        if (this.velocity.y < 0) {
          this.velocity.y = 0;
          this.y = block.y + block.height - this.collisionOffset.y + buffer;
          break;
        }
        // Landing collision (from above)
        if (this.velocity.y > 0) {
          this.velocity.y = 0;
          this.y = block.y - this.collisionSize.height - this.collisionOffset.y - buffer;
          this.isOnGround = true;
          if (wasInAir) this.land();
          break;
        }
      }
    }
  }

  checkPlatformCollisions(platforms, deltaTime) {
    const buffer = 0.0001;
    let wasInAir = !this.isOnGround;
    
    // Only check if moving downward
    if (this.velocity.y <= 0) return;

    const collisionBox = {
      x: this.x + this.collisionOffset.x,
      y: this.y + this.collisionOffset.y,
      width: this.collisionSize.width,
      height: this.collisionSize.height
    };

    for (let platform of platforms) {
      if (this.isColliding(collisionBox, platform)) {
        this.velocity.y = 0;
        this.y = platform.y - this.collisionSize.height - this.collisionOffset.y - buffer;
        this.isOnGround = true;
        if (wasInAir) this.land();
        return; // Only land on one platform
      }
    }
    this.isOnGround = false;
  }

  isColliding(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }
  
  // In Player.js, modify checkItemCollisions:
  checkItemCollisions(itemLayer, itemType) {
    const tileSize = 16;
    // Check multiple points for better collision detection
    const checkPoints = [
      { x: this.x + this.width/2, y: this.y + this.height/2 }, // Center
      { x: this.x, y: this.y }, // Top-left
      { x: this.x + this.width, y: this.y } // Top-right
    ];

    for (let point of checkPoints) {
      const tileX = Math.floor(point.x / tileSize);
      const tileY = Math.floor(point.y / tileSize);
      
      if (tileY >= 0 && tileY < itemLayer.length &&
          tileX >= 0 && tileX < itemLayer[tileY].length &&
          itemLayer[tileY][tileX] === 1) {
        
        if (!gameStateManager.isItemCollected(itemType, tileX, tileY)) {
          if (itemType === 'coin') gameStateManager.addCoin();
          if (itemType === 'can') gameStateManager.addCan();
          gameStateManager.markItemCollected(itemType, tileX, tileY);
          itemLayer[tileY][tileX] = 0;
          break; // Only collect once per frame
        }
      }
    }
  }
  
  // Check for collision with spikes
  checkSpikeCollisions(spikesLayer) {
    // Calculate tile coordinates
    const tileSize = 16;
    const playerCenterX = this.x + this.width / 2;
    const playerBottom = this.y + this.height;
    
    const tileX = Math.floor(playerCenterX / tileSize);
    const tileY = Math.floor(playerBottom / tileSize);
    
    // Spike tile IDs
    const spikeTiles = [7, 8, 87, 88];
    
    // Check the tile at the player's position
    if (
      tileY >= 0 && tileY < spikesLayer.length &&
      tileX >= 0 && tileX < spikesLayer[tileY].length &&
      spikeTiles.includes(spikesLayer[tileY][tileX])
    ) {
      // Take damage
      this.takeDamage();
    }
  }
  
  // Check if player has reached level complete zone
  checkLevelComplete(completionZone) {
    // Note: The completion zone should be defined in your game code
    // For example: { x, y, width, height }
    
    if (completionZone) {
      if (
        this.x < completionZone.x + completionZone.width &&
        this.x + this.width > completionZone.x &&
        this.y < completionZone.y + completionZone.height &&
        this.y + this.height > completionZone.y
      ) {
        gameStateManager.changeState(gameStateManager.states.LEVEL_COMPLETE);
      }
    }
  }
}

// ./classes/SoundManager.js
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


// ./classes/TimeManager.js
// TimeManager.js - A centralized timing system for the game
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

  update() {
    if (this.isPaused) return;
    
    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    
    // Clamp deltaTime to prevent huge jumps if browser tab was inactive
    if (this.deltaTime > 0.1) this.deltaTime = 0.1;
    
    this.lastTime = currentTime;
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

// Set canvas size
canvas.width = 1024 * dpr;
canvas.height = 576 * dpr;

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

const renderLayer = (tilesData, tilesetImage, tileSize, context) => {
  const tilesPerRow = Math.ceil(tilesetImage.width / tileSize)
  tilesData.forEach((row, y) => {
    row.forEach((symbol, x) => {
      if (symbol !== 0) {
        const tileIndex = symbol - 1
        const srcX = (tileIndex % tilesPerRow) * tileSize
        const srcY = Math.floor(tileIndex / tilesPerRow) * tileSize
        context.drawImage(
          tilesetImage,
          srcX, srcY,
          tileSize, tileSize,
          x * 16, y * 16,
          16, 16
        )
      }
    })
  })
}

const renderStaticLayers = async () => {
  const offscreenCanvas = document.createElement('canvas')
  offscreenCanvas.width = canvas.width
  offscreenCanvas.height = canvas.height
  const offscreenContext = offscreenCanvas.getContext('2d')

  for (const [layerName, tilesData] of Object.entries(layersData)) {
    const tilesetInfo = tilesets[layerName]
    if (tilesetInfo) {
      try {
        const tilesetImage = await loadImage(tilesetInfo.imageUrl)
        renderLayer(tilesData, tilesetImage, tilesetInfo.tileSize, offscreenContext)
      } catch (error) {
        console.error(`Failed to load image for layer ${layerName}:`, error)
      }
    }
  }
  return offscreenCanvas
}

// Initialize player (keep your existing initialization)
const player = new Player({
  x: 100,
  y: 100,
  size: 32, // Make sure this matches your sprite size
  velocity: { x: 0, y: 0 } // Explicitly provide velocity
});

const keys = {
  w: { pressed: false },
  a: { pressed: false },
  d: { pressed: false }
}

// MODIFIED GAME LOOP
function animate(backgroundCanvas) {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000;
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
    console.log('Initializing game systems...');
    
    // Initialize systems (no deltaTime needed here)
    await Promise.all([
      hud.init(),
      soundManager.init(),
      gameStateManager.init()
    ]);
    
    console.log('Loading map...');
    const backgroundCanvas = await renderStaticLayers();
    if (!backgroundCanvas) {
      console.error('Failed to create background canvas');
      return;
    }

    // Initialize camera with map bounds
    const mapWidth = layersData.l_Collisions[0].length * 16;
    const mapHeight = layersData.l_Collisions.length * 16;
    cameraController.init(mapWidth, mapHeight);
    
    console.log('Starting game loop...');
    
    // Initialize time tracking for game loop
    lastTime = performance.now();
    
    // Start game loop
    animate(backgroundCanvas);
    
    // Set initial game state
    gameStateManager.changeState(gameStateManager.states.INTRO);

    document.addEventListener('keydown', (e) => {
        if (gameStateManager.currentState === gameStateManager.states.INTRO) {
            gameStateManager.changeState(gameStateManager.states.PLAYING);
            soundManager.playMusic('intro');
        }
    });
    
  } catch (error) {
    console.error('Game initialization failed:', error);
    // Add more detailed error logging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
};

// Start the game
startGame();

// ./index.html
<!DOCTYPE html>
<html>
<head>
    <link rel="icon" href="data:,"> <!-- Empty favicon to prevent 404 -->
    <title>2D Platformer</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            border: 0;
            font: inherit;
            vertical-align: baseline;
        }
        body {
            background: black;
            margin: 0;
            overflow: hidden;
        }
        canvas {
            width: 1024px;
            height: 576px;
            image-rendering: pixelated;
            display: block;
        }
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    
    <!--
    <div style="position: absolute; top: 10px; left: 10px; z-index: 100;">
         <button onclick="gameStateManager.startGame()">Force Start Game</button>
    </div>
    -->

    <!-- Core Systems -->
    <script src="./classes/TimeManager.js"></script>
    <script src="./classes/SoundManager.js"></script>
    <script src="./classes/GameStateManager.js"></script>

    <!-- Other Classes -->
    <script src="./classes/AnimationController.js"></script>
    <script src="./classes/CameraController.js"></script>
    <script src="./classes/GameRenderer.js"></script>
    <script src="./classes/HUD.js"></script>
    <script src="./classes/CollisionBlock.js"></script>
    <script src="./classes/Platform.js"></script>
    <script src="./classes/Player.js"></script>

    <!-- Utils -->
    <script src="./js/utils.js"></script>
    
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