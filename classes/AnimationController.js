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

