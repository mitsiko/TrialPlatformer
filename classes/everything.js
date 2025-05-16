// ./classes/AnimationController.js
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
    // Load all player animations - Removed landing animation
    await this.loadAnimation('idle', 'images/idle.png', 1, 32, 32);
    await this.loadAnimation('running', 'images/running.png', 8, 32, 32);
    await this.loadAnimation('jumping', 'images/jumping.png', 3, 40, 40);
    await this.loadAnimation('falling', 'images/falling.png', 1, 40, 40);
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
  
  play(animationName, loop = true, frameRate = 0.1, callback = null) {
    if (!this.animations[animationName]) {
      console.error(`Animation not found: ${animationName}`);
      return;
    }
    
    // Only change animation if it's different or we're forcing a restart
    if (this.currentAnimation !== animationName || !loop) {
      console.log(`Playing animation: ${animationName}, loop: ${loop}`);
      this.currentAnimation = animationName;
      this.currentFrame = 0;
      this.frameTimer = 0;
      this.isPlaying = true;
      this.isLooping = loop;
      this.frameDuration = frameRate;
      
      // Store callback
      this.onAnimationComplete = callback || null;
    }
  }


  update(deltaTime) {
    if (!this.isPlaying || !this.currentAnimation) return;
    
    this.frameTimer += deltaTime;
    
    if (this.frameTimer >= this.frameDuration) {
      this.frameTimer = 0;
      this.currentFrame++;
      
      const animation = this.animations[this.currentAnimation];
      if (!animation) return;
      
      // Animation complete handling
      if (this.currentFrame >= animation.frameCount) {
        if (this.isLooping) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = animation.frameCount - 1;
          this.isPlaying = false;
          
          // Execute callback if exists
          if (this.onAnimationComplete) {
            const callback = this.onAnimationComplete;
            // Clear before firing to prevent potential loops
            this.onAnimationComplete = null;
            callback();
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
    
    // Calculate draw position (center-bottom aligned)
    const drawX = x - animation.frameWidth / 2; // Center horizontally
    const drawY = y - animation.frameHeight;    // Align bottom
    
    if (this.flipped) {
      // For left-facing sprites
      context.translate(drawX + animation.frameWidth, drawY);
      context.scale(-1, 1);
      context.drawImage(
        animation.spriteSheet,
        frame.x, frame.y, 
        frame.width, frame.height,
        0, 0,
        frame.width, frame.height
      );
    } else {
      // For right-facing sprites (default)
      context.drawImage(
        animation.spriteSheet,
        frame.x, frame.y, 
        frame.width, frame.height,
        drawX, drawY,
        frame.width, frame.height
      );
    }
    
    context.restore();
  }


  // Set the horizontal flip state based on direction
  setDirection(direction) {
    // direction: 1 for right, -1 for left
    this.flipped = direction < 0;
  }
  
  // Check if an animation has completed (for non-looping animations)
  // In AnimationController.js - add this method
  isComplete() {
    if (!this.currentAnimation || !this.animations[this.currentAnimation]) return false;
    
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
      const callback = this.onAnimationComplete;
      this.onAnimationComplete = null;
      callback();
    }
  }
}

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

// ./classes/Player.js
// Updated Player.js with animation and movement states
const X_VELOCITY = 120;       // Reduced from 200 for better control
const JUMP_POWER = 350;       // Increased from 250 for better feel
const VERTICAL_HOP_POWER = 300; // Smaller jump for vertical hops
const GRAVITY = 900;          // Increased from 580 for snappier falls
const SKID_DECELERATION = 20; // Add this new constant
const INVINCIBILITY_TIME = 3; // Seconds of invincibility after taking damage
const FALL_DAMAGE_HEIGHT = 3; // Multiple of player height for fall damage
const FALL_ANIMATION_HEIGHT = 2; // Multiple of player height for falling animation
const PLAYER_HEIGHT = 32;     // Your player's height in pixels

class Player {
  constructor({ x = 0, y = 0, size = 32, velocity = { x: 0, y: 0 } } = {}) {
    this.x = x;
    this.y = y;
    this.width = size;
    this.height = size;  
    this.velocity = { x: 0, y: 0 }; // Properly initialize velocity object
    this.isOnGround = false;
    
    this.direction = 1; // 1 for right, -1 for left
    
    // Movement state
    this.movementState = 'idle'; // idle, running, jumping, falling, death
    this.inJump = false; // Add this line
    this.canJump = true;
    this.canMove = true;
    this.inputLocked = false;  // For hop animations
    
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
    
    // Updated collision properties
    this.collisionOffset = {
      x: size * 0.15,  // 15% from left
      y: size * 0.1    // 10% from top
    };
    this.collisionSize = {
      width: size * 0.7,
      height: size * 0.9  // 90% of player height
    };

    this.maxFallDistance = 0; // Track maximum fall distance
    this.wasOnGround = true;  // Track previous ground state
    
    console.log("Player initialized");
  }

  async init() {
    // Initialize animation states
    await this.animation.init();
    console.log("Player animations initialized");
    
    // Make sure we start with the idle animation
    this.movementState = 'idle';
    this.animation.play('idle', true);
  }

  draw(c) {
    if (this.isInvincible && !this.isVisible) return;
    
    // Calculate actual draw position (bottom-center of collision box)
    const drawX = this.x + this.width / 2;  // Center of player
    const drawY = this.y + this.height;     // Bottom of player
    
    // Draw animation centered horizontally and aligned at feet
    this.animation.draw(c, drawX, drawY);

    if (!this.isOnGround && this.fallStartY) {
      c.fillStyle = 'rgba(255, 255, 0, 0.5)';
      c.fillRect(
        this.x - 10, 
        this.fallStartY, 
        20, 
        this.y - this.fallStartY
      );
      
      c.fillStyle = 'white';
      c.fillText(
        `Fall: ${Math.floor(this.y - this.fallStartY)}px`, 
        this.x - 30, 
        this.fallStartY - 10
      );
    }
    /*
    
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
    
    c.fillStyle = 'white';
    c.font = '12px Arial';
    c.fillText(`State: ${this.movementState} | Grounded: ${this.isOnGround}`, 20, 30);
    c.fillText(`Velocity Y: ${this.velocity.y.toFixed(1)}`, 20, 50);

    */
  }

  update(deltaTime, collisionBlocks, platforms) {
    if (!deltaTime) return;

    if (!this.isOnGround) {
      console.log("Current fall distance:", this.y - this.fallStartY, 
                "Threshold:", this.height * FALL_DAMAGE_HEIGHT);
    }
    // Update animation first
    this.animation.update(deltaTime);

    // Update invincibility state
    this.updateInvincibility(deltaTime);

    // Store previous grounded state for fall tracking
    const wasOnGround = this.isOnGround;
    this.isOnGround = false; // Reset each frame

    // Apply gravity if not grounded
    if (!this.isOnGround) {
      this.applyGravity(deltaTime);
      if (this.velocity.y > 500) this.velocity.y = 500; // Terminal velocity
    }

    // Only process movement if not in death state
    if (this.movementState !== 'death') {
      // Update fall tracking
      this.updateFallTracking();
      
      // Handle input if not locked
      if (!this.inputLocked) {
        this.handleInput(keys);
      }

      // Update horizontal position first
      this.x += this.velocity.x * deltaTime;

      // Update vertical position
      this.y += this.velocity.y * deltaTime;

      // Check platform collisions
      this.checkPlatformCollisions(platforms, deltaTime);
      if (gameStateManager.currentState === gameStateManager.states.PLAYING) {
        this.checkSpikeCollisions(layersData.l_Spikes);
      }

      // Update movement state - must be last!
      this.updateMovementState(wasOnGround);
    }
  }


  // In Player.js - update the updateInvincibility method
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
    // Update wasOnGround at start of frame
    this.wasOnGround = this.isOnGround;

    // Start tracking fall when leaving ground
    if (this.wasOnGround && !this.isOnGround && this.velocity.y >= 0) {
      this.fallStartY = this.y;
      this.maxFallDistance = 0;
      console.log("Fall tracking started at Y:", this.fallStartY);
    }

    // Update max fall distance while falling
    if (!this.isOnGround && this.velocity.y > 0) {
      const currentFallDistance = this.y - this.fallStartY;
      if (currentFallDistance > this.maxFallDistance) {
        this.maxFallDistance = currentFallDistance;
      }
    }

    // Check for landing and apply damage if needed
    if (!this.wasOnGround && this.isOnGround) {
      console.log("Landed after falling", this.maxFallDistance, "pixels");
      
      if (this.maxFallDistance >= this.height * FALL_DAMAGE_HEIGHT && !this.isInvincible) {
        console.log("Fell", this.maxFallDistance, "pixels - applying damage!");
        this.takeDamage();
      }
    }
  }


  jump() {
    if (this.isOnGround && this.canJump && !this.inputLocked) {
      this.velocity.y = -JUMP_POWER;
      this.isOnGround = false;
      this.canJump = false;
      this.movementState = 'jumping';
      
      this.animation.play('jumping', false, 0.1, () => {
        // When jump animation completes, lock last frame
        if (!this.isOnGround) {
          this.animation.currentFrame = this.animation.animations['jumping'].frameCount - 1;
          this.animation.isPlaying = false;
        }
      });
      soundManager.playSound('landing');
    }
  }
    
  verticalHop() {
    if (this.isOnGround && this.canJump && !this.inputLocked) {
      console.log("Vertical hop executed");
      
      this.velocity.y = -VERTICAL_HOP_POWER;
      this.isOnGround = false;
      this.canJump = false;
      this.inputLocked = true; // Lock controls during hop
      this.movementState = 'falling'; // Use falling state for hop
      
      // Play falling animation for the hop
      this.animation.play('falling', true);
      // Could play jump sound here
    }
    soundManager.playSound('landing');
  }
  
  // In Player.js - update the takeDamage method
  takeDamage() {
    // Skip if already invincible or in death state
    if (this.isInvincible || this.movementState === 'death') return;
    
    console.log("Player took damage from fall!");
    
    // Remove a life
    if (typeof gameStateManager !== 'undefined') {
      gameStateManager.removeLife();
    }
    
    // Start invincibility period
    this.isInvincible = true;
    this.invincibilityTimer = 0;
    
    // If no lives left, die
    if (typeof gameStateManager !== 'undefined' && gameStateManager.lives <= 0) {
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
    if (typeof timeManager !== 'undefined' && typeof gameStateManager !== 'undefined') {
      timeManager.setTimeout(() => {
        gameStateManager.changeState(gameStateManager.states.GAME_OVER);
      }, 3);
    }
  }

  applyGravity(deltaTime) {
    this.velocity.y += GRAVITY * deltaTime;
  }

  handleInput(keys) {
    if (!keys) return;
    
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
    
    console.log("Final velocity:", this.velocity, "Movement state:", this.movementState);
  }


    // In Player.js - update the updateMovementState method
  updateMovementState(wasOnGround) {
    if (this.movementState === 'death') return;

    // Handle landing detection
    if (!wasOnGround && this.isOnGround) {
      this.handleLanding();
      return;
    }

    // Airborne states
    if (!this.isOnGround) {
      if (this.velocity.y < 0) {
        // Going up - use jumping animation
        if (this.movementState !== 'jumping') {
          this.setAnimationState('jumping', false);
        }
      } else {
        // Going down - maintain jump's last frame if this was a jump
        if (this.movementState === 'jumping') {
          // Ensure we're showing the last frame
          if (this.animation.currentAnimation === 'jumping' && this.animation.isComplete()) {
            this.animation.currentFrame = this.animation.animations['jumping'].frameCount - 1;
            this.animation.isPlaying = false;
          }
        } else {
          // Only show falling if not from a jump
          this.setAnimationState('falling', true);
        }
      }
      return;
    }

    // Grounded states
    if (Math.abs(this.velocity.x) > 10) {
      this.setAnimationState('running', true);
    } else {
      this.setAnimationState('idle', true);
    }
  }

  // In Player.js - update the handleLanding method
  handleLanding() {
    // Reset states
    this.isFalling = false;
    this.fallStartY = 0;
    
    // Reset animation based on input
    if (Math.abs(this.velocity.x) > 10) {
      this.setAnimationState('running', true);
    } else {
      this.setAnimationState('idle', true);
    }
    
    // Reset movement abilities
    this.canJump = true;
    this.inputLocked = false;
  }

  setAnimationState(state, loop) {
    if (this.movementState === state) return;
    
    // Never override jump animation while airborne
    if (this.movementState === 'jumping' && !this.isOnGround) return;
    
    this.movementState = state;
    switch(state) {
      case 'idle':
        this.animation.play('idle', loop);
        break;
      case 'running':
        this.animation.play('running', loop);
        break;
      case 'jumping':
        this.animation.play('jumping', false, 0.1, () => {
          if (!this.isOnGround) {
            this.animation.currentFrame = this.animation.animations['jumping'].frameCount - 1;
            this.animation.isPlaying = false;
          }
        });
        break;
      case 'falling':
        this.animation.play('falling', loop);
        break;
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
          this.velocity.x = 0;
        }
        // Right collision
        else if (this.velocity.x > 0) {
          this.x = block.x - this.collisionSize.width - this.collisionOffset.x - buffer;
          this.velocity.x = 0;
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
          this.canJump = true; // Reset ability to jump
          break;
        }
      }
    }
  }

  checkPlatformCollisions(platforms, deltaTime) {
    const buffer = 0.0001;
    
    // Only check if moving downward or stationary
    if (this.velocity.y <= 0) return;

    const collisionBox = {
      x: this.x + this.collisionOffset.x,
      y: this.y + this.collisionOffset.y,
      width: this.collisionSize.width,
      height: this.collisionSize.height
    };

    for (let platform of platforms) {
      if (platform.checkCollision(this, deltaTime)) {
        this.velocity.y = 0;
        this.y = platform.y - this.collisionSize.height - this.collisionOffset.y - buffer;
        this.isOnGround = true;
        this.canJump = true;
        this.inputLocked = false;
        break; // Only need one platform collision
      }
    }
  }


  isColliding(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  
  // Check item collisions
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
    if (this.isInvincible) return; // Skip if invincible
    
    const tileSize = 16;
    // Check multiple points around the player's collision box
    const checkPoints = [
      // Bottom points (feet)
      { x: this.x + this.collisionOffset.x + this.collisionSize.width/2, y: this.y + this.collisionOffset.y + this.collisionSize.height },
      // Top points (head)
      { x: this.x + this.collisionOffset.x + this.collisionSize.width/2, y: this.y + this.collisionOffset.y },
      // Left side
      { x: this.x + this.collisionOffset.x, y: this.y + this.collisionOffset.y + this.collisionSize.height/2 },
      // Right side
      { x: this.x + this.collisionOffset.x + this.collisionSize.width, y: this.y + this.collisionOffset.y + this.collisionSize.height/2 }
    ];

    // Spike tile IDs
    const spikeTiles = [7, 8, 87, 88];
    
    for (let point of checkPoints) {
      const tileX = Math.floor(point.x / tileSize);
      const tileY = Math.floor(point.y / tileSize);
      
      if (
        tileY >= 0 && tileY < spikesLayer.length &&
        tileX >= 0 && tileX < spikesLayer[tileY].length &&
        spikeTiles.includes(spikesLayer[tileY][tileX])
      ) {
        this.takeDamage();
        break; // Only take damage once per check
      }
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
  velocity: { x: 0, y: 0 }
});

const keys = {
  w: { pressed: false },
  a: { pressed: false },
  d: { pressed: false }
}

// MODIFIED GAME LOOP
async function animate(backgroundCanvas) {
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
    console.log('Initializing game systems...');
    
    // Initialize systems (no deltaTime needed here)
    await Promise.all([
      hud.init(),
      soundManager.init(),
      gameStateManager.init(),
      player.init() // Make sure to initialize player animations
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