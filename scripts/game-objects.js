class GameObject {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  draw(ctx, offsetX, offsetY) {
    const x = (this.x + 0.5 - offsetX) * TILE_SIZE;
    const y = (this.y + 0.5 - offsetY) * TILE_SIZE;

    if (this.drawImage) {
      this.drawImage(ctx, x, y)
    }

  }
}

class Character extends GameObject {
  constructor(game, x, y, data) {
    super(x, y);
    this.game = game;
    Object.keys(data).forEach((stat) => {
      this[stat] = data[stat];
    })
  }

  move(dx, dy) {
    const newX = this.x + dx;
    const newY = this.y + dy;
    const newSpace = this.game.dungeon.canMoveTo(newX, newY);
    if (newSpace) {
      this.x = newX;
      this.y = newY;

      if (this.pickUp) {
        this.pickUp(newSpace);
      }
      this.game.draw();
    }
  }
}

class Player extends Character {
  constructor(game, x, y, data) {
    super(game, x, y, data);
    this.name = 'Player';
  }

  drawImage(ctx, x, y) {
    ctx.fillStyle = '#c42';
    ctx.beginPath();
    ctx.arc(x, y, PLAYER_SIZE, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  pickUp(item) {
    if (item.canPickUp) {
      this.gold += item.amount;
      const index = this.game.dungeon.objects.indexOf(item);
      this.game.dungeon.objects.splice(index, 1);
    }
  }
}

class Enemy extends Character {
  constructor(game, x, y, data) {
    super(game, x, y, data);
  }
}

class Goblin extends Enemy {
  constructor(game, x, y, data) {
    super(game, x, y, data);
    this.name = 'Goblin';
    this.r = TILE_SIZE * 0.32;
  }

  drawImage(ctx, x, y) {
    ctx.fillStyle = '#381';
    ctx.beginPath();
    ctx.arc(x, y, this.r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    const r = this.r;
    const r2 = r * 1.2;
    ctx.moveTo(x, y);
    ctx.lineTo(x - r, y - r2);
    ctx.lineTo(x - r, y);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x + r, y - r2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#b00';
    ctx.beginPath();
    ctx.moveTo(x - 1, y - 1);
    ctx.lineTo(x - 9, y - 7);
    ctx.lineTo(x - 7, y - 2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 1, y - 1);
    ctx.lineTo(x + 9, y - 7);
    ctx.lineTo(x + 7, y - 2);
    ctx.closePath();
    ctx.fill();
  }
}

class Gold extends GameObject {
  constructor(x, y, amount) {
    super(x, y);
    this.name = 'Gold: ' + amount;
    this.canPickUp = true;
    this.amount = amount;
    this.r = TILE_SIZE * 0.25;
  }

  drawImage(ctx, x, y) {
    ctx.strokeStyle = '#830';
    ctx.fillStyle = '#dc0';
    ctx.beginPath();
    ctx.arc(x, y, this.r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = '#830';
    ctx.font = "12px Georgia";
    ctx.fillText(this.amount, x, y);
  }
}