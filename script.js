window.addEventListener('load', function() {
  const canvas = document.getElementById('canvas-1');
  const ctx = canvas.getContext('2d');
  canvas.width = 960;
  canvas.height = 640;

  const TILE_SIZE = 40;
  const PLAYER_SIZE = TILE_SIZE * 0.44;

  class InputHandler {
    constructor(game) {
      this.game = game;
      window.addEventListener('keydown', (evt) => {
        switch (evt.key) {
          case 'ArrowLeft':
            this.game.player.move(-1, 0);
            break;
          case 'ArrowRight':
            this.game.player.move(1, 0);
            break;
          case 'ArrowUp':
            this.game.player.move(0, -1);
            break;
          case 'ArrowDown':
            this.game.player.move(0, 1);
            break;
        }
      });
    }
  }

  class Dungeon {
    constructor(map) {
      this.map = map;
      this.maxX = map[0].length;
      this.maxY = map.length;
      this.screenX = Math.ceil(canvas.width / TILE_SIZE);
      this.screenY = Math.ceil(canvas.height / TILE_SIZE);
      this._findObjects(map);
    }

    _findObjects(map) {
      this.objects = {
        enemies: [],
        gold: [],
      };

      for (let y = 0; y < map.length; y++) {
        const row = map[y];
        for (let x = 0; x < row.length; x++) {
          if (row[x] === '@') {
            this.objects.player = {x, y};
          } else if (row[x] === '1') {
            this.objects.enemies.push({x, y});
          } else if (row[x] === '*') {
            this.objects.gold.push(new Gold(x, y));
          }
        }
      }
    }

    draw(offsetX, offsetY) {
      for (let y = 0; y < this.screenY; y++) {
        const row = this.map[y + offsetY];
        const tileY = y * TILE_SIZE;

        for (let x = 0; x < this.screenX; x++) {
          const tileX = x * TILE_SIZE;
          if (row[x + offsetX] === '#') {
            ctx.fillStyle = '#666';
          } else {
            ctx.fillStyle = '#ddd';
          }
          ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
        }
      }

      this.objects.gold.forEach((gold) => gold.draw(offsetX, offsetY));
    }

    isBlocked(x, y) {
      if (y < 0 || y >= this.maxY) {
        return true;
      }
      if (x < 0 || x >= this.maxX) {
        return true;
      }

      return this.map[y][x] !== ' ';
    }
  }

  class GameObject {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }

    draw(offsetX, offsetY) {
      const x = (this.x + 0.5 - offsetX) * TILE_SIZE;
      const y = (this.y + 0.5 - offsetY) * TILE_SIZE;
      if (this.drawImage) {
        this.drawImage(x, y)
      }
    }
  }

  class Character extends GameObject {
    constructor(game, x, y, data) {
      super(x, y);
      this.game = game;
      this.health = data.health;
      this.attack = data.attack;
      this.defense = data.defense;
    }

    move(dx, dy) {
      const newX = this.x + dx;
      const newY = this.y + dy;
      if (!this.game.dungeon.isBlocked(newX, newY)) {
        this.x = newX;
        this.y = newY;
        this.game.draw();
      }
    }
  }

  class Player extends Character {
    constructor(game, x, y, data) {
      super(game, x, y, data);
      this.gold = 0;
    }

    drawImage(x, y) {
      ctx.fillStyle = '#c42';
      ctx.beginPath();
      ctx.arc(x, y, PLAYER_SIZE, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
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
      this.r = TILE_SIZE * 0.32;
    }

    drawImage(x, y) {
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
    constructor(game, x, y) {
      super(game, x, y);
      this.r = TILE_SIZE * 0.25;
    }

    drawImage(x, y) {
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
      ctx.fillText("10", x, y);
    }
  }

  class Game {
    constructor(map) {
      this.inputHandler = new InputHandler(this);
      this.dungeon = new Dungeon(map);

      this.offsetX = 0;
      this.offsetY = 0;
      this.maxOffsetX = this.dungeon.maxX - this.dungeon.screenX;
      this.maxOffsetY = this.dungeon.maxY - this.dungeon.screenY;

      const player = this.dungeon.objects.player;
      if (player) {
        this.player = new Player(this, player.x, player.y, player);
      }

      this.enemies = [];
      this.dungeon.objects.enemies.forEach((enemy) => {
        this.enemies.push(new Goblin(this, enemy.x, enemy.y, enemies.goblin));
      }) 
    }

    draw() {
      this._findOffset();
      this.dungeon.draw(this.offsetX, this.offsetY);
      this.enemies.forEach((enemy) => enemy.draw(this.offsetX, this.offsetY));
      this.player.draw(this.offsetX, this.offsetY);
    }

    _findOffset() {
      const px = (this.player.x - this.offsetX) * TILE_SIZE;
      const py = (this.player.y - this.offsetY) * TILE_SIZE;
      
      if (px > canvas.width * 0.8 && this.offsetX < this.maxOffsetX) {
        this.offsetX++;
      } else if (px < canvas.width * 0.2 && this.offsetX > 0) {
        this.offsetX--;
      }

      if (py > canvas.height * 0.8 && this.offsetY < this.maxOffsetY) {
        this.offsetY++;
      } else if (py < canvas.height * 0.2 && this.offsetY > 0) {
        this.offsetY--;
      }
    }
  }

  const game = new Game(dungeonMap);
  game.draw();

});
