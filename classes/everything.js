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

// ./classes/GameRenderer.js - Handles rendering game states and UI
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

// ./classes/HUD.js - Heads-up display rendering
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

// ./classes/Player.js
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
      x: size * 0.25,  // 15% from left
      y: size * 0.1    // 10% from top
    };
    this.collisionSize = {
      width: size * 0.4,
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

  // In Player.js - modify the draw method
  draw(c) {
    if (this.isInvincible && !this.isVisible) return;
    
    // Apply scale to player position - match the map scaling
    const scale = cameraController.scale;
    const drawX = (this.x + this.width / 2) * scale;  // Center of player
    const drawY = (this.y + this.height) * scale;     // Bottom of player
    
    // Draw animation centered horizontally and aligned at feet
    this.animation.draw(c, drawX, drawY);
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

// ./js/index.js - MODIFIED SECTION

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const c = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;

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
  
  // Loop through and render all map layers
  for (const [layerName, tilesData] of Object.entries(layersData)) {
    const tilesetInfo = tilesets[layerName];
    if (tilesetInfo) {
      try {
        const tilesetImage = await loadImage(tilesetInfo.imageUrl);
        renderLayer(tilesData, tilesetImage, tilesetInfo.tileSize, offscreenContext, scale);
        loadedLayers.push(layerName);
      } catch (error) {
        console.error(`Failed to load image for layer ${layerName}:`, error);
      }
    }
  }
  
  console.log(`Successfully rendered layers: ${loadedLayers.join(', ')}`);
  
  return {
    canvas: offscreenCanvas,
    scale: scale
  };
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
async function animate(backgroundCanvas) {
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
    
    // Only update gameplay elements when in PLAYING state
    if (gameStateManager.currentState === gameStateManager.states.PLAYING) {
        // Update camera before player to ensure proper following
        cameraController.update(player);
        
        // Update player position and state
        player.update(cappedDeltaTime, collisionBlocks, platforms);
        
        // Check item collisions only when playing
        player.checkItemCollisions(layersData.l_Coins, 'coin');
        player.checkItemCollisions(layersData.l_Cans, 'can');
    }

    // Apply camera transform to context
    cameraController.applyTransform(c);
    
    // Draw background map
    c.drawImage(backgroundCanvas, 0, 0);
    
    // Draw player
    player.draw(c);
    
    // Reset transform before drawing UI
    cameraController.resetTransform(c);
    
    // Always draw HUD (not affected by camera)
    hud.draw(c);

    // Continue the game loop
    requestAnimationFrame(() => animate(backgroundCanvas));
}

// MODIFIED START FUNCTION
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
    
    // Get the map data and scale from renderStaticLayers
    const { canvas: backgroundCanvas, scale } = await renderStaticLayers();
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

// .index.html

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
        
        html, body {
            height: 100%;
            width: 100%;
            overflow: hidden;
            background: #1a261f;
            margin: 0;
            padding: 0;
        }
        
        body {
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .game-container {
            position: relative;
            max-width: 100vw;
            max-height: 100vh;
            aspect-ratio: 640 / 352; /* Match your canvas aspect ratio */
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        canvas {
            /* Size limitations to maintain aspect ratio */
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            
            /* Ensure the canvas is properly displayed */
            display: block;
            
            /* Border for visibility */
            border: 1px solid #333;
            
            /* Critical for pixel art: prevent blurry scaling */
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
            -ms-interpolation-mode: nearest-neighbor;
        }
    </style>
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