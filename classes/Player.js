// Updated Player.js with animation and movement states
const X_VELOCITY = 200;
const JUMP_POWER = 250;
const VERTICAL_HOP_POWER = 180; // Smaller jump for vertical hops
const GRAVITY = 580;
const INVINCIBILITY_TIME = 3; // Seconds of invincibility after taking damage
const FALL_DAMAGE_HEIGHT = 3; // Multiple of player height for fall damage

class Player {
  constructor({ x, y, size, velocity = { x: 0, y: 0 } }) {
    this.x = x;
    this.y = y;
    this.width = size;
    this.height = size;
    this.velocity = velocity;
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
  }

  draw(c) {
    // Skip drawing if blinking during invincibility
    if (this.isInvincible && !this.isVisible) return;
    
    // Draw animation at bottom-center of player
    this.animation.draw(c, this.x, this.y + this.height);
    
    // Debug bounding box
    // c.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    // c.strokeRect(this.x, this.y, this.width, this.height);
  }

  update(deltaTime, collisionBlocks) {
    if (!deltaTime) return;
    
    // Update animation
    this.animation.update(deltaTime);
    
    // Update invincibility state
    this.updateInvincibility(deltaTime);
    
    // Only apply gravity and movement if not in death state
    if (this.movementState !== 'death') {
      this.applyGravity(deltaTime);
      
      // Update fall tracking for fall damage
      this.updateFallTracking();
      
      // Update horizontal position only if movement is not locked
      if (!this.inputLocked) {
        this.updateHorizontalPosition(deltaTime);
      }
      
      this.checkForHorizontalCollisions(collisionBlocks);
      this.checkPlatformCollisions(platforms, deltaTime);
      this.updateVerticalPosition(deltaTime);
      this.checkForVerticalCollisions(collisionBlocks);
      
      // Check for falling out of bounds
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
    // Only trigger landing if we're not already in landing state
    if (this.movementState !== 'landing') {
      this.movementState = 'landing';
      this.inputLocked = true; // Lock controls during landing
      
      // Play landing animation (non-looping)
      this.animation.play('landing', false, 0.1, () => {
        // When landing completes, unlock controls and return to idle
        this.inputLocked = false;
        this.movementState = 'idle';
        this.animation.play('idle', true);
      });
    }
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
    // Skip input handling if controls are locked
    if (this.inputLocked) return;
    
    // Default to zero horizontal velocity
    this.velocity.x = 0;
    
    // Handle horizontal movement
    if (keys.d.pressed) {
      this.velocity.x = X_VELOCITY;
      this.direction = 1; // facing right
      this.animation.setDirection(1);
    } else if (keys.a.pressed) {
      this.velocity.x = -X_VELOCITY;
      this.direction = -1; // facing left
      this.animation.setDirection(-1);
    }
    
    // Jump only happens on keydown event in eventListeners.js
  }
  
  updateMovementState() {
    // Death state overrides all others
    if (this.movementState === 'death') return;
    
    // Landing state is handled by the animation callback
    if (this.movementState === 'landing') return;
    
    // Jumping state is handled by jump() method and animation callback
    if (this.movementState === 'jumping') return;
    
    if (!this.isOnGround) {
      // If we're not on ground and moving upward, we're likely in a jump
      // If moving downward, we're falling
      if (this.velocity.y > 0) {
        this.movementState = 'falling';
        this.animation.play('falling', true);
      }
    } else {
      // On ground - either idle or running
      this.canJump = true;
      
      if (this.velocity.x !== 0) {
        this.movementState = 'running';
        this.animation.play('running', true, 0.1);
      } else {
        this.movementState = 'idle';
        this.animation.play('idle', true);
      }
    }
  }

  checkForHorizontalCollisions(collisionBlocks) {
    const buffer = 0.0001;
    for (let i = 0; i < collisionBlocks.length; i++) {
      const collisionBlock = collisionBlocks[i];

      // Check if a collision exists on all axes
      if (
        this.x <= collisionBlock.x + collisionBlock.width &&
        this.x + this.width >= collisionBlock.x &&
        this.y + this.height >= collisionBlock.y &&
        this.y <= collisionBlock.y + collisionBlock.height
      ) {
        // Check collision while player is going left
        if (this.velocity.x < -0) {
          this.x = collisionBlock.x + collisionBlock.width + buffer;
          break;
        }

        // Check collision while player is going right
        if (this.velocity.x > 0) {
          this.x = collisionBlock.x - this.width - buffer;
          break;
        }
      }
    }
  }

  checkForVerticalCollisions(collisionBlocks) {
    const buffer = 0.0001;
    let wasInAir = !this.isOnGround;
    this.isOnGround = false;
    
    for (let i = 0; i < collisionBlocks.length; i++) {
      const collisionBlock = collisionBlocks[i];

      // If a collision exists
      if (
        this.x <= collisionBlock.x + collisionBlock.width &&
        this.x + this.width >= collisionBlock.x &&
        this.y + this.height >= collisionBlock.y &&
        this.y <= collisionBlock.y + collisionBlock.height
      ) {
        // Check collision while player is going up
        if (this.velocity.y < 0) {
          this.velocity.y = 0;
          this.y = collisionBlock.y + collisionBlock.height + buffer;
          break;
        }

        // Check collision while player is going down
        if (this.velocity.y > 0) {
          this.velocity.y = 0;
          this.y = collisionBlock.y - this.height - buffer;
          this.isOnGround = true;
          
          // If we just landed from being in the air
          if (wasInAir && this.movementState === 'falling') {
            this.land();
          }
          
          break;
        }
      }
    }
  }

  checkPlatformCollisions(platforms, deltaTime) {
    const buffer = 0.0001;
    let wasInAir = !this.isOnGround;
    
    // Only check platforms if we're falling
    if (this.velocity.y <= 0) return;
    
    for (let platform of platforms) {
      if (platform.checkCollision(this, deltaTime)) {
        this.velocity.y = 0;
        this.y = platform.y - this.height - buffer;
        this.isOnGround = true;
        
        // If we just landed from being in the air
        if (wasInAir && this.movementState === 'falling') {
          this.land();
        }
        
        return;
      }
    }
  }
  
  // Check for collision with items like coins and cans
  checkItemCollisions(itemLayer, itemType) {
    // Calculate tile coordinates
    const tileSize = 16;
    const playerCenterX = this.x + this.width / 2;
    const playerBottom = this.y + this.height;
    
    const tileX = Math.floor(playerCenterX / tileSize);
    const tileY = Math.floor(playerBottom / tileSize);
    
    // Check the tile at the player's position
    if (
      tileY >= 0 && tileY < itemLayer.length &&
      tileX >= 0 && tileX < itemLayer[tileY].length &&
      itemLayer[tileY][tileX] === 1
    ) {
      // Check if the item has already been collected
      if (!gameStateManager.isItemCollected(itemType, tileX, tileY)) {
        // Collect the item
        if (itemType === 'coin') {
          gameStateManager.addCoin();
        } else if (itemType === 'can') {
          gameStateManager.addCan();
        }
        
        // Mark as collected
        gameStateManager.markItemCollected(itemType, tileX, tileY);
        
        // Remove from layer (set to 0)
        itemLayer[tileY][tileX] = 0;
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