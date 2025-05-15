// Updated Player.js with animation and movement states
const X_VELOCITY = 150;       // Reduced from 200 for better control
const JUMP_POWER = 350;       // Increased from 250 for better feel
const VERTICAL_HOP_POWER = 300; // Smaller jump for vertical hops
const GRAVITY = 900;          // Increased from 580 for snappier falls
const SKID_DECELERATION = 20; // Add this new constant
const INVINCIBILITY_TIME = 3; // Seconds of invincibility after taking damage
const FALL_DAMAGE_HEIGHT = 3; // Multiple of player height for fall damage

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

    c.fillStyle = 'white';
    c.font = '12px Arial';
    c.fillText(`State: ${this.movementState} | Grounded: ${this.isOnGround}`, 20, 30);
    c.fillText(`Velocity Y: ${this.velocity.y.toFixed(1)}`, 20, 50);
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
      
      // Reset grounded state before checking collisions
      this.isOnGround = false;
      
      // Check platform collisions first (since we removed blocks)
      this.checkPlatformCollisions(platforms, deltaTime);

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
    }
  }


  jump() {
    if (this.isOnGround && this.canJump && !this.inputLocked) {
      console.log("Jump executed");
      
      this.velocity.y = -JUMP_POWER;
      this.isOnGround = false;
      this.canJump = false;
      this.movementState = 'jumping';
      
      // Play jump animation (non-looping)
      this.animation.play('jumping', false, 0.1, () => {
        // When jump animation completes, transition to falling
        this.movementState = 'falling';
        this.animation.play('falling', true);
      });
      
      // Could play jump sound here if available
      // soundManager.playSound('jump');
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
      // soundManager.playSound('jump');
    }
  }
  
  takeDamage() {
    // Skip if already invincible
    if (this.isInvincible) return;
    
    // Remove a life if GameStateManager exists
    if (typeof gameStateManager !== 'undefined') {
      gameStateManager.removeLife();
    }
    
    // If player is still alive, make them invincible temporarily
    if (typeof gameStateManager !== 'undefined' && gameStateManager.lives > 0) {
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


  updateMovementState() {
    if (this.movementState === 'death') return;

    // Airborne states
    if (!this.isOnGround) {
      if (this.velocity.y < 0) {
        this.setAnimationState('jumping', false);
      } else {
        this.setAnimationState('falling', true);
      }
      return;
    }

    // Grounded states (on platforms)
    if (Math.abs(this.velocity.x) > 10) {
      this.setAnimationState('running', true);
    } else {
      this.setAnimationState('idle', true);
    }
  }

  setAnimationState(state, loop) {
    if (this.movementState === state) return;
    
    this.movementState = state;
    switch(state) {
      case 'idle':
        this.animation.play('idle', loop);
        break;
      case 'running':
        this.animation.play('running', loop);
        break;
      case 'jumping':
        this.animation.play('jumping', loop, 0.1, () => {
          if (!this.isOnGround && this.velocity.y >= 0) {
            this.setAnimationState('falling', true);
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
      // Check if player is above the platform and moving downward
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