class GameRenderer {
    constructor() {
        this.offscreenCanvas = null;
        this.splashImage = null;
    }
    
    async init() {
        // We don't need to load splash images as we're rendering directly
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
        context.fillStyle = '#1a261f';
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
        context.fillStyle = 'rgba(26, 38, 31, 0.8)'; // Semi-transparent dark green
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
        
        // Draw "Press enter to continue" text (flashing)
        const stateTime = gameStateManager.getStateTime();
        if (Math.floor(stateTime * 2) % 2 === 0) {
            context.font = '24px monospace';
            context.fillText(
                'Press enter to continue',
                canvas.width / dpr / 2,
                canvas.height / dpr / 2 + 60
            );
        }
        
        // Restore context state
        context.restore();
    }
    
    drawLevelCompleteScreen(context) {
        // Save current state
        context.save();
        
        // Clear and scale for device pixel ratio
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        // Fill black background
        context.fillStyle = '#1a261f';
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
        
        // Draw "Press any key" text (flashing)
        const stateTime = gameStateManager.getStateTime();
        if (stateTime > 2 && Math.floor(stateTime * 2) % 2 === 0) {
            context.font = '24px monospace';
            context.fillText(
                'Press any key to play again',
                canvas.width / dpr / 2,
                canvas.height / dpr / 2 + 60
            );
        }
        
        // Restore context state
        context.restore();
    }
    
    drawGameOverScreen(context) {
        // Save current state
        context.save();
        
        // Clear and scale for device pixel ratio
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        // Fill black background
        context.fillStyle = '#1a261f';
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
        
        // Draw "Press any key" text (flashing)
        const stateTime = gameStateManager.getStateTime();
        if (stateTime > 2 && Math.floor(stateTime * 2) % 2 === 0) {
            context.font = '24px monospace';
            context.fillText(
                'Press any key to play again',
                canvas.width / dpr / 2,
                canvas.height / dpr / 2 + 60
            );
        }
        
        // Restore context state
        context.restore();
    }
}