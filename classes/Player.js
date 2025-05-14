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

      // Add this check to prevent landing state from persisting
      if (this.movementState === 'landing' && this.animation.isComplete() && this.isOnGround) {
        this.inputLocked = false;
        if (keys.a.pressed || keys.d.pressed) {
          this.movementState = 'running';
          this.animation.play('running', true);
        } else {
          this.movementState = 'idle';
          this.animation.play('idle', true);
        }
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
    // Prevent duplicate landings
    if (this.movementState === 'landing') return;
    
    console.log("Triggering landing animation");
    this.movementState = 'landing';
    this.inputLocked = true;
    
    this.animation.play('landing', false, 0.1, () => {
      console.log("Landing animation completed");
      this.inputLocked = false;
      
      // Check current input to determine next state
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
    if (this.movementState === 'death' || 
        this.movementState === 'landing' && !this.animation.isComplete()) {
      return;
    }

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

    // Grounded states - only transition if not in landing animation
    if (this.movementState === 'landing' && !this.animation.isComplete()) {
      return;
    }

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
    this.isOnGround = false; // Reset before checking
    
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
        // More precise landing check - must be coming from above
        if (this.y + this.height <= platform.y + platform.height && 
            this.velocity.y > 0) {
          this.velocity.y = 0;
          this.y = platform.y - this.collisionSize.height - this.collisionOffset.y - buffer;
          this.isOnGround = true;
          
          // Only trigger landing if we were in air and not already landing
          if (wasInAir && this.movementState !== 'landing') {
            this.land();
          }
          return;
        }
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