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

    update(deltaTime) {
        if (this.isPaused) return;
        
        this.deltaTime = deltaTime;
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
        this.isPaused = false;
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