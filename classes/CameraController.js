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