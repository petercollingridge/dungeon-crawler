class GameObject {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  draw(ctx, tileX, tileY) {
    if (this.drawImage) {
      this.imageX = tileX + 0.5 * TILE_SIZE;
      this.imageY = tileY + 0.5 * TILE_SIZE;
      this.drawImage(ctx, this.imageX, this.imageY);
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
    let obstruction = this.game.dungeon.checkIfBlocked(newX, newY);

    if (obstruction) {
      if (this.isEnemy(obstruction.type)) {
        this.attack(obstruction);
        this.moveRemaining = 0;
        this._endMove();
      }
      if (obstruction.pickUp && this.pickUp) {
        this.pickUp(obstruction);
        obstruction = false;
      }
    } else {
      // Remove from old tile
      const map = this.game.dungeon.map;
      map[this.y][this.x].content = false;

      // Add to new tile
      this.x = newX;
      this.y = newY;
      map[this.y][this.x].content = this;

      this.moveRemaining--;
    }

    if (this.moveRemaining === 0 && this._endMove) {
      this._endMove();
    }

    // this.game.update();
    this.game.draw();
  }

  attack(target) {
    const baseAttack = 6;
    const attackRoll = this._roll(baseAttack, this.attackValue);

    if (attackRoll === 'FUMBLE') {
      this.addText('Fumble!');
      target.attack(this);
      return;
    }

    const defendValue = 1 + Math.floor(Math.random() * baseAttack) + target.defendValue;

    let damage = 0;
    if (attackRoll === 'CRITICAL') {
      this.addText('Critical hit!');
      damage = Math.max(1, baseAttack + this.attackValue - defendValue) * 2;
      target.addText(`-${damage}`);
    } else if (attackRoll > defendValue) {
      damage = attackRoll - defendValue;
      target.addText(`-${damage}`);
    } else {
      target.addText(`Defend`);
      return;
    }

    target.health -= damage;

    if (target.health <= 0) {
      target.health = 0;
      this.kills(target);
    }
  }

  addText(text, colour) {
    colour = colour || this.textColour;
    this.game.addText(this.imageX, this.imageY - 10, text, colour);
  }

  _roll(n = 10, modifier = 0) {
    const rawValue = Math.random();
    if (rawValue > 1 - this.critical) {
      return 'CRITICAL';
    }

    const roundValue = 1 + Math.floor(rawValue * n);
    if (roundValue === 1) {
      return 'FUMBLE';
    } else {
      return roundValue + modifier;
    }
  }
}

class Player extends Character {
  constructor(game, x, y, data) {
    super(game, x, y, data);

    this.type = 'Player';
    this.name = 'Player';
    this.textColour = '192, 64, 32';
    this.targetXP = 100;
    this._calculateCritical();
  }

  drawImage(ctx, x, y) {
    ctx.fillStyle = '#c42';
    ctx.beginPath();
    ctx.arc(x, y, PLAYER_SIZE, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  isEnemy(type) {
    return type === 'enemy';
  }

  pickUp(item) {
    if (item.canPickUp) {
      this.gold += item.amount;
      const index = this.game.dungeon.objects.indexOf(item);
      this.game.dungeon.objects.splice(index, 1);
    }
  }

  kills(target) {
    target.addText(`${target.name} killed`);
    this.game.dungeon.removeCharacter(target);

    this.xp += target.xp;
    this.addText(`+${target.xp} XP`, '255, 255, 255');

    if (this.xp >= this.targetXP) {
      this.level++;
      this.xp -= this.targetXP;
      this.targetXP = Math.round(this.targetXP * 0.24) * 5;
      this.addText(`Level Up!`);
    }
  }

  _calculateCritical() {
    this.critical = (this.xp + 3) / (this.xp * 5 + 75)
  }

  _endMove() {
    this.game.endPlayerTurn();
  }
}

class Enemy extends Character {
  constructor(game, x, y, data) {
    super(game, x, y, data);
    this.type = 'enemy';
    this.textColour = '48, 128, 16';
  }

  isEnemy(type) {
    return type === 'Player';
  }

  kills() {
    this.game.gameOver();
  }

  calculateMove() {
    const player = this.game.dungeon.player;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const sx = Math.sign(dx);
    const sy = Math.sign(dy);

    if (abs(dx) + abs(dy) === 1) {
      this.attack(player);
      this.moveRemaining = 0;
      return;
    }

    const testMove = (dx, dy) => {
      return !this.game.dungeon.checkIfBlocked(this.x + dx, this.y + dy);
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
