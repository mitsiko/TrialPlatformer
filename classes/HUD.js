// ./classes/HUD.js - Add a condition to only display HUD in the PLAYING state

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
    // Only draw HUD if the game is in PLAYING state
    if (!this.initialized || gameStateManager.currentState !== gameStateManager.states.PLAYING) return;
    
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
  
  // Rest of HUD methods remain unchanged...
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