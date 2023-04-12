class GameObject {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  draw(ctx, tileX, tileY) {
    if (this.drawImage) {
      const x = tileX + 0.5 * TILE_SIZE;
      const y = tileY + 0.5 * TILE_SIZE;
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
    this.moveRemaining = this.speed;
  }

  resetMoves() {
    this.moveRemaining = this.speed;
  }

  move(dx, dy) {
    if (!this.moveRemaining) {
      return;
    }

    const newX = this.x + dx;
    const newY = this.y + dy;
    const newSpace = this.game.dungeon.canMoveTo(newX, newY);
    if (newSpace) {
      // Remove from old tile
      const map = this.game.dungeon.map;
      map[this.y][this.x].content = false;

      // Add to new tile
      this.x = newX;
      this.y = newY;
      map[this.y][this.x].content = this;

      if (this.pickUp) {
        this.pickUp(newSpace);
      }

      this.moveRemaining--;
      if (this.moveRemaining === 0 && this._endMove) {
        this._endMove();
      }

      this.game.update();
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

  _endMove() {
    this.game.endPlayerTurn();
  }
}

class Enemy extends Character {
  constructor(game, x, y, data) {
    super(game, x, y, data);
    this.type = 'enemy';
  }

  calculateMove() {
    const player = this.game.dungeon.player;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const sx = Math.sign(dx);
    const sy = Math.sign(dy);

    const testMove = (dx, dy) => {
      return this.game.dungeon.canMoveTo(this.x + dx, this.y + dy);
    };

    let moveX = testMove(sx, 0) ? sx : 0;
    let moveY = testMove(0, sy) ? sy : 0;

    // If enemy can move in both directions then pick ome
    if (moveX && moveY) {
      // If dx and dy are the same, then randomly pick one
      const tiebreak = abs(dx) === abs(dy) ? Math.random() - 0.5 : 0;

      if (abs(dx) > abs(dy) + tiebreak) {
        moveY = 0;
      } else {
        moveX = 0;
      }
    }


    console.log(moveX, moveY);

    if (moveX || moveY) {
      this.move(moveX, moveY);
    } else {
      // Can't move so don't keep trying
      this.moveRemaining = 0;
    }
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

  pickUp(player) {
    player.gold += this.amount;
  }
}
