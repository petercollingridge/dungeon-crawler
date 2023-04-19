// Text which moves and fades out over time

class TextController {
  constructor(game) {
    this.game = game;
    this.delay = 0;
    this.queue = [];
    this.particles = [];

    // Milliseconds between adding new text
    // Delay to avoid text overlapping
    this.DELAY_TIME = 360;
  }

  update(dt) {
    if (this.delay > 0) {
      this.delay -= dt

      if (this.delay <= 0) {
        if (this.queue.length > 0) {
          const particle = this.queue.shift();
          this.particles.push(particle);
          this.delay = this.DELAY_TIME;
        }
      }
    }

    this.particles.forEach(particle => particle.update());
    this.particles = this.particles.filter(particle => !particle.toDelete);
  }

  draw(ctx) {
    this.particles.forEach(particle => particle.draw(ctx));
  }

  add(x, y, text) {
    const Particle = new TextParticle(x, y, text);
    if (this.delay > 0) {
      this.queue.push(Particle);
    } else {
      this.particles.push(Particle);
      // Don't add more text for 200ms
      this.delay = this.DELAY_TIME;
    }
  }
}

class TextParticle {
  constructor(x, y, text, speed = 1.75, size = 28) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.speed = speed;
    this.alpha = 1.0;
    this.toDelete = false;
    this.size = size;
  }

  update () {
    this.y -= this.speed;
    this.alpha -= 0.0075;
    this.size += 0.3;
    if (this.y < -20 || this.alpha <= 0) {
      this.toDelete = true;
    }
  }
  
  draw(ctx) {
    this.font = `${this.size}px Bangers`;
    ctx.fillStyle = `rgba(255, 0, 0, ${this.alpha})`;
    ctx.font = this.font;
    ctx.fillText(this.text, this.x, this.y);
  } 
}