// Text which moves and fades out over time

class TextController {
  constructor(game) {
    this.game = game;
    this.particles = [];
  }

  update() {
    this.particles.forEach(particle => particle.update());
    this.particles = this.particles.filter(particle => !particle.toDelete);
  }

  draw(ctx) {
    this.particles.forEach(particle => particle.draw(ctx));
  }

  add(x, y, text) {
    this.particles.push(new TextParticle(x, y, text));
  }
}

class TextParticle {
  constructor(x, y, text, speed = 1, size = 36) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.speed = speed;
    this.alpha = 1.0;
    this.toDelete = false;
    this.font = `${size}px Helvetica`;
  }

  update () {
    this.y -= this.speed;
    this.alpha -= 0.01;
    if (this.y < -20 || this.alpha <= 0) {
      this.toDelete = true;
    }
  }
  
  draw(ctx) {
    ctx.fillStyle = `rgba(255, 0, 0, ${this.alpha})`;
    ctx.font = this.font;
    ctx.fillText(this.text, this.x, this.y);
  } 
}