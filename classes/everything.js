// ./classes/Player.js - Updated version that is given by Claude
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

// ./classes/Platform.js - Part of intial expoert from online map editor
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
    // Check only top-side collision
    return (
      player.y + player.height <= this.y &&
      player.y + player.height + player.velocity.y * deltaTime >= this.y &&
      player.x + player.width > this.x &&
      player.x < this.x + this.width
    )
  }
}

// ./classes/AnimationController.js - Given by Claude
// AnimationController.js - Handles sprite animations for the player
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
    await this.loadAnimation('landing', 'images/landing.png', 4, 40, 40);
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
    
    // Only restart if it's a different animation
    if (this.currentAnimation !== animationName) {
      this.currentAnimation = animationName;
      this.currentFrame = 0;
      this.frameTimer = 0;
      this.isPlaying = true;
      this.isLooping = loop;
      this.frameDuration = frameRate;
      this.onAnimationComplete = callback;
    }
  }
  
  update(deltaTime) {
    if (!this.isPlaying || !this.currentAnimation) return;
    
    const animation = this.animations[this.currentAnimation];
    if (!animation) return;
    
    this.frameTimer += deltaTime;
    
    // Time to advance to next frame
    if (this.frameTimer >= this.frameDuration) {
      this.frameTimer = 0;
      this.currentFrame++;
      
      // Check if animation is complete
      if (this.currentFrame >= animation.frameCount) {
        if (this.isLooping) {
          // Loop back to first frame
          this.currentFrame = 0;
        } else {
          // Stop at last frame
          this.currentFrame = animation.frameCount - 1;
          this.isPlaying = false;
          
          // Call the completion callback if provided
          if (this.onAnimationComplete) {
            this.onAnimationComplete();
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


// ./classes/CameraController.js - Given by Claude
// CameraController.js - Handles camera scrolling and following player
class CameraController {
  constructor() {
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

// Export a singleton instance
const cameraController = new CameraController();

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

// ./classes/GameRenderer.js - Given by Claude
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

// Export a singleton instance
const gameRenderer = new GameRenderer();

// ./classes/GameStateManager.js - Given by Claude
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
    
    // Store time when state was entered
    this.stateEnteredTime = 0;
    
    // Player stats
    this.lives = 3;
    this.coins = 0;
    this.cans = 0;
    
    this.coinsCollected = new Set(); // Store collected coin positions
    this.cansCollected = new Set();  // Store collected can positions
  }
  
  init() {
    this.reset();
  }
  
  reset() {
    this.lives = 3;
    this.coins = 0;
    this.cans = 0;
    this.coinsCollected.clear();
    this.cansCollected.clear();
    this.changeState(this.states.INTRO);
  }
  
  changeState(newState) {
    const oldState = this.currentState;
    this.currentState = newState;
    this.stateEnteredTime = timeManager.gameTime;
    
    // Call any registered callbacks for this state change
    if (this.stateChangeCallbacks[newState]) {
      this.stateChangeCallbacks[newState].forEach(callback => callback(oldState));
    }
    
    // Handle special state transitions
    switch (newState) {
      case this.states.INTRO:
        soundManager.stopMusic();
        timeManager.reset();
        break;
        
      case this.states.PLAYING:
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
        // Auto-transition back to intro after delay
        timeManager.setTimeout(() => {
          this.changeState(this.states.INTRO);
        }, 3);
        break;
        
      case this.states.GAME_OVER:
        soundManager.playMusic('gameOver');
        // Auto-transition back to intro after delay
        timeManager.setTimeout(() => {
          this.changeState(this.states.INTRO);
        }, 8);
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

// Export a singleton instance
const gameStateManager = new GameStateManager();

// ./classes/HUD.js - Given by Claude
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
    this.fontColor = '#FFFDD0'; // Cream color
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

// Export a singleton instance
const hud = new HUD();

// ./classes/SoundManager.js - Given by Claude
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
    this.loadMusic('gameOver', 'sounds/faltliningTrimmed.mp3');
    
    // Load sound effects
    this.loadSound('jump', 'sounds/jump.mp3');
    this.loadSound('coin', 'sounds/coin.mp3');
    this.loadSound('can', 'sounds/can.mp3');
    this.loadSound('hurt', 'sounds/hurt.mp3');
    
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
    if (!this.initialized) return;
    
    // Stop current music if any
    this.stopMusic();
    
    const music = this.music[name];
    if (music) {
      music.currentTime = 0;
      music.play();
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

// Export a singleton instance
const soundManager = new SoundManager();

// ./classes/TimeManager.js - Given by Claude
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

// Export a singleton instance
const timeManager = new TimeManager();


// ./js/eventListeners.js - Part of intial expoert from online map editor
window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'w':
      player.jump()
      keys.w.pressed = true
      break
    case 'a':
      keys.a.pressed = true
      break
    case 'd':
      keys.d.pressed = true
      break
  }
})

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'a':
      keys.a.pressed = false
      break
    case 'd':
      keys.d.pressed = false
      break
  }
})

// On return to game's tab, ensure delta time is reset
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    lastTime = performance.now()
  }
})


// ./js/index.js - Part of intial expoert from online map editor
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
const dpr = window.devicePixelRatio || 1

canvas.width = 1024 * dpr
canvas.height = 576 * dpr

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


// Tile setup
const collisionBlocks = []
const platforms = []
const blockSize = 16 // Assuming each tile is 16x16 pixels

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
  // Calculate the number of tiles per row in the tileset
  // We use Math.ceil to ensure we get a whole number of tiles
  const tilesPerRow = Math.ceil(tilesetImage.width / tileSize)

  tilesData.forEach((row, y) => {
    row.forEach((symbol, x) => {
      if (symbol !== 0) {
        // Adjust index to be 0-based for calculations
        const tileIndex = symbol - 1

        // Calculate source coordinates
        const srcX = (tileIndex % tilesPerRow) * tileSize
        const srcY = Math.floor(tileIndex / tilesPerRow) * tileSize

        context.drawImage(
          tilesetImage, // source image
          srcX,
          srcY, // source x, y
          tileSize,
          tileSize, // source width, height
          x * 16,
          y * 16, // destination x, y
          16,
          16, // destination width, height
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
        renderLayer(
          tilesData,
          tilesetImage,
          tilesetInfo.tileSize,
          offscreenContext,
        )
      } catch (error) {
        console.error(`Failed to load image for layer ${layerName}:`, error)
      }
    }
  }

  // Optionally draw collision blocks and platforms for debugging
  // collisionBlocks.forEach(block => block.draw(offscreenContext));
  // platforms.forEach((platform) => platform.draw(offscreenContext))

  return offscreenCanvas
}
// END - Tile setup

// Change xy coordinates to move player's default position
const player = new Player({
  x: 100,
  y: 100,
  size: 16,
  velocity: { x: 0, y: 0 },
})

const keys = {
  w: {
    pressed: false,
  },
  a: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
}

let lastTime = performance.now()
function animate(backgroundCanvas) {
  // Calculate delta time
  const currentTime = performance.now()
  const deltaTime = (currentTime - lastTime) / 1000
  lastTime = currentTime

  // Update player position
  player.handleInput(keys)
  player.update(deltaTime, collisionBlocks)

  // Render scene
  c.save()
  c.scale(dpr, dpr)
  c.clearRect(0, 0, canvas.width, canvas.height)
  c.drawImage(backgroundCanvas, 0, 0)
  player.draw(c)
  c.restore()

  requestAnimationFrame(() => animate(backgroundCanvas))
}

const startRendering = async () => {
  try {
    const backgroundCanvas = await renderStaticLayers()
    if (!backgroundCanvas) {
      console.error('Failed to create the background canvas')
      return
    }

    animate(backgroundCanvas)
  } catch (error) {
    console.error('Error during rendering:', error)
  }
}

startRendering()


// ./js/utils.js - Part of intial expoert from online map editor
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}


// index.html - Part of intial expoert from online map editor, not yet modified by Claude
<!DOCTYPE html>
<html>
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
  }

  canvas {
    width: 1024px;
    height: 576px;
  }
  </style>
  <canvas style="image-rendering: pixelated"></canvas>
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
  <script src="./js/utils.js"></script>
  <script src="./classes/CollisionBlock.js"></script>
  <script src="./classes/Platform.js"></script>
  <script src="./classes/Player.js"></script>

  <script src="./js/index.js"></script>
  <script src="./js/eventListeners.js"></script>
</html>