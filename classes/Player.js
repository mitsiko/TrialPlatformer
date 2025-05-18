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
    
    // Apply scale to player position
    const scale = cameraController.scale;
    const drawX = (this.x + this.width / 2) * scale;  // Center of player
    const drawY = (this.y + this.height) * scale;     // Bottom of player
    
    // Draw animation centered horizontally and aligned at feet
    this.animation.draw(c, drawX, drawY);

    // DEBUG: Uncomment if needed for debugging
    /*
    // Draw collision box (scaled)
    c.fillStyle = 'rgba(255, 0, 0, 0.3)';
    c.fillRect(
      (this.x + this.collisionOffset.x) * scale,
      (this.y + this.collisionOffset.y) * scale,
      this.collisionSize.width * scale,
      this.collisionSize.height * scale
    );

    // Draw feet position (scaled)
    c.fillStyle = 'blue';
    c.fillRect(
      (this.x + this.collisionOffset.x + this.collisionSize.width/2 - 2) * scale,
      (this.y + this.collisionOffset.y + this.collisionSize.height - 2) * scale,
      4 * scale, 4 * scale
    );

    // Draw center point (scaled)
    c.fillStyle = 'green';
    c.fillRect(
      (this.x + this.width/2 - 2) * scale,
      (this.y + this.height/2 - 2) * scale,
      4 * scale, 4 * scale
    );
    
    c.fillStyle = 'white';
    c.font = `${12 * scale}px Arial`;
    c.fillText(`State: ${this.movementState} | Grounded: ${this.isOnGround}`, 20 * scale, 30 * scale);
    c.fillText(`Velocity Y: ${this.velocity.y.toFixed(1)}`, 20 * scale, 50 * scale);
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