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