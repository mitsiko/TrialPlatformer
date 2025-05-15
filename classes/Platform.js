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
    return (
      // Player's feet are above platform
      player.y + player.height <= this.y + 2 && // Small tolerance
      // Player is moving downward toward platform
      player.y + player.height + player.velocity.y * deltaTime >= this.y &&
      // Player is horizontally within platform bounds
      player.x + player.width > this.x &&
      player.x < this.x + this.width
    )
  }
}