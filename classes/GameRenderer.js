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

