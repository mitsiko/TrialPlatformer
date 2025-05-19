// Fix for the CameraController class to properly clamp and scale with the canvas

class CameraController {
  constructor(canvas, dpr) {
    this.canvas = canvas;
    this.dpr = dpr || 1;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.smoothing = 0.1; // Lower = smoother camera
    this.mapWidth = 0;
    this.mapHeight = 0;
    this.scale = 1;
    this.viewWidth = canvas.width / dpr;
    this.viewHeight = canvas.height / dpr;
  }

  init(mapWidth, mapHeight, scale) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.scale = scale;
    // Viewable area dimensions (accounting for DPR)
    this.viewWidth = this.canvas.width / this.dpr;
    this.viewHeight = this.canvas.height / this.dpr;
    
    console.log(`Camera initialized with:`, {
      mapWidth: this.mapWidth,
      mapHeight: this.mapHeight,
      scale: this.scale,
      viewWidth: this.viewWidth,
      viewHeight: this.viewHeight
    });
  }

  update(target) {
    if (!target) return;
    
    // Player is centered horizontally except near map edges
    this.targetX = (target.x + target.width / 2) * this.scale - this.viewWidth / 2;
    
    // Player is positioned slightly below center vertically
    const verticalOffset = this.viewHeight * 0.4; // Position player at 40% from top
    this.targetY = (target.y + target.height / 2) * this.scale - verticalOffset;
    
    // Apply camera smoothing
    this.x += (this.targetX - this.x) * this.smoothing;
    this.y += (this.targetY - this.y) * this.smoothing;
    
    // Clamp to map boundaries - this is the key fix
    this.x = Math.max(0, Math.min(this.x, this.mapWidth - this.viewWidth));
    this.y = Math.max(0, Math.min(this.y, this.mapHeight - this.viewHeight));
  }

  applyTransform(ctx) {
    ctx.save();
    // Use Math.round to ensure pixel-perfect positioning
    ctx.translate(-Math.round(this.x), -Math.round(this.y));
  }

  resetTransform(ctx) {
    ctx.restore();
  }

  // Helper method to convert world coordinates to screen coordinates
  worldToScreen(x, y) {
    return {
      x: x * this.scale - this.x,
      y: y * this.scale - this.y
    };
  }

  // Helper method to convert screen coordinates to world coordinates
  screenToWorld(x, y) {
    return {
      x: (x + this.x) / this.scale,
      y: (y + this.y) / this.scale
    };
  }
}