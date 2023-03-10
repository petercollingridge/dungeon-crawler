window.addEventListener('load', function() {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 960;
  canvas.height = 640;

  class InputHandler {
    constructor(game) {
      this.game = game;
      window.addEventListener('keydown', (evt) => {
        switch (evt.key) {
          case 'ArrowLeft':
            this.game.dungeon.player.move(-1, 0);
            break;
          case 'ArrowRight':
            this.game.dungeon.player.move(1, 0);
            break;
          case 'ArrowUp':
            this.game.dungeon.player.move(0, -1);
            break;
          case 'ArrowDown':
            this.game.dungeon.player.move(0, 1);
            break;
        }
      });

      canvas.addEventListener('mouseup', (evt) => {
        const x = evt.offsetX;
        const y = evt.offsetY;
        this.game.click(x, y);
      });
    }
  }

  class Dungeon {
    constructor(game, map) {
      this.game = game;
      this.maxX = map[0].length;
      this.maxY = map.length;
      this.screenX = Math.ceil(canvas.width / TILE_SIZE);
      this.screenY = Math.ceil(canvas.height / TILE_SIZE);
      this.drawCount = 0;

      // Use map to create a grid of tiles
      this.map = [];
      for (let y = 0; y < this.maxY; y++) {
        const tileRow = [];
        const mapRow = map[y];
        this.map.push(tileRow);

        for (let x = 0; x < this.maxX; x++) {
          if (mapRow[x] === '#') {
            tileRow.push({ type: 'wall' });
          } else {
            const tile = { type: 'floor' }
            tileRow.push(tile);
            // Add tile contents
            if (mapRow[x] === '@') {
              this.player = new Player(game, x, y, STATS.player);
              tile.content = this.player;
            } else if (mapRow[x] === '1') {
              const enemy = new Goblin(game, x, y, STATS.goblin);
              tile.content = enemy;
            } else if (mapRow[x] === '*') {
              tile.content = new Gold(x, y, 25);
            }
          }
        }
      }
    }

    draw(ctx, offsetX, offsetY) {
      this.drawCount++;
      ctx.fillStyle = '#112';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      this._drawMap(ctx, offsetX, offsetY);
    }

    _drawMap(ctx, offsetX, offsetY) {
      this._findVisibleTiles();

      for (let y = 0; y < this.screenY; y++) {
        const row = this.map[y + offsetY];
        const tileY = y * TILE_SIZE;

        for (let x = 0; x < this.screenX; x++) {
          const tile = row[x + offsetX];
          // Don't draw tiles that have never been seen
          if (!tile.visible) {
            continue;
          }

          // Tile visible this time are fully visible, otherwise they are faded
          const opacity = tile.visible === this.drawCount ? 1 : 0.5;
          if (tile.type === 'wall') {
            ctx.fillStyle = `rgb(100, 70, 20, ${opacity})`;
          } else {
            ctx.fillStyle = `rgb(225, 220, 200, ${opacity})`;
          }

          const tileX = x * TILE_SIZE;
          ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);

          if (tile.content && opacity === 1) {
            tile.content.draw(ctx, tileX, tileY);
          }
        }
      }
    }

    _findVisibleTiles() {
      const px = this.player.x;
      const py = this.player.y;
      const frontier = [[px, py]];

      // Map a coordinate to whether a tile is visible
      const visitedTiles = {};

      // Tile with player is always visible
      visitedTiles[`${px},${py}`] = true;

      while (frontier.length) {
        const [x, y] = frontier.shift();

        // Test if visible by drawing a line from this tile to the player
        // If we hit an non-visible tile then this is not visible
        // https://www.redblobgames.com/grids/line-drawing.html
        const dx = px - x;
        const dy = py - y;

        const length = Math.abs(Math.abs(dx) > Math.abs(dy) ? dx : dy);

        let visible = true;
        for (let i = 1; i < length; i++) {
          const t = i / length;
          const sx = x + Math.round(t * dx);
          const sy = y + Math.round(t * dy);
          // If we hit a tile that's not visited, then it must be blocked
          if (!visitedTiles[`${sx},${sy}`]) {
            visible = false;
            break;
          }
        }

        // Walls are visible but do not propagate visibility
        if (this.map[y][x].type === 'wall') {
          this.map[y][x].visible = this.drawCount;
          continue;
        }

        if (!visible) {
          continue;
        }

        this.map[y][x].visible = this.drawCount;
        visitedTiles[`${x},${y}`] = true;

        // Add neighbours to frontier
        for (let i = 0; i < 4; i++) {
          const [dx, dy] = DELTAS[i];
          const x2 = x + dx;
          const y2 = y + dy;
          if (x2 >= 0 && x2 < this.maxX && y2 >= 0 && y2 < this.maxY) {
            if (visitedTiles[`${x2},${y2}`] === undefined) {

              // Mark as visited so we don't check again
              // But set as not visible as we assume it's not initially
              visitedTiles[`${x2},${y2}`] = false;
              frontier.push([x2, y2]);
            }
          }
        }
      }
    }

    canMoveTo(x, y) {
      // Check map bounds
      if (y < 0 || y >= this.maxY || x < 0 || x >= this.maxX) {
        return false;
      }

      // Hit wall
      if (this.map[y][x].type === 'wall') {
        return false;
      }

      const content = this.map[y][x].content;
      if (content) {
        if (!content.pickUp) {
          return false;
        }
        return content;
      }

      return true;
    }

    getObjectAt(x, y) {
      // Check map bounds
      if (y < 0 || y >= this.maxY) {
        return null;
      }
      if (x < 0 || x >= this.maxX) {
        return null;
      }

      return this.map[y][x].content || this.map[y][x].type;
    }
  }

  class UI {
    constructor(game) {
      this.game = game;
      this.header = document.getElementById('sidebar-header');
      this.contents = document.getElementById('sidebar-contents');
      this.button = document.getElementById('sidebar-btn');
      this.statsTypes = ['xp', 'gold', 'speed', 'moveRemaining', 'attack', 'defend'];

      this.button.disabled = true;
      this.button.addEventListener('click', () => {
        this.game.enemyTurn();
        this.button.disabled = true;
        this.button.innerHTML = 'Enemy turn';
      });
    }

    update() {
      const item = this.game.selectedItem;
      this.contents.innerHTML = '';

      if (typeof item === 'string') {
        this.header.innerText = item;
      } else if (item) {
        this.header.innerText = item.name;
        const ul = document.createElement('ul');
        
        this.statsTypes.forEach((stat) => {
          if (item[stat] !== undefined) {
            const li = document.createElement('li');
            li.innerText = `${stat}: ${item[stat]}`;
            ul.appendChild(li);
          }
        });

        this.contents.appendChild(ul);
      }
    }

    endPlayerTurn() {
      this.button.disabled = false;
    }
  }

  class Game {
    constructor(map) {
      this.UI = new UI(this);
      this.inputHandler = new InputHandler(this);
      this.dungeon = new Dungeon(this, map);
      this.turn = 'player';

      this.offsetX = 0;
      this.offsetY = 0;
      this.maxOffsetX = this.dungeon.maxX - this.dungeon.screenX;
      this.maxOffsetY = this.dungeon.maxY - this.dungeon.screenY;
    }

    draw() {
      this._findOffset();
      this.dungeon.draw(ctx, this.offsetX, this.offsetY);
    }

    update() {
      this.UI.update();
    }

    enemyTurn() {
      console.log('enemy turn');
      this.turn = 'player';
      this.dungeon.player.startTurn();
    }

    click(x, y) {
      const tileX = Math.floor(x / TILE_SIZE) + this.offsetX;
      const tileY = Math.floor(y / TILE_SIZE) + this.offsetY;
      this.selectedItem = this.dungeon.getObjectAt(tileX, tileY);
      this.UI.update();
    }

    _findOffset() {
      const px = (this.dungeon.player.x - this.offsetX) * TILE_SIZE;
      const py = (this.dungeon.player.y - this.offsetY) * TILE_SIZE;
      const p = 0.3;
      
      if (px > canvas.width * (1 - p) && this.offsetX < this.maxOffsetX) {
        this.offsetX++;
      } else if (px < canvas.width * p && this.offsetX > 0) {
        this.offsetX--;
      }

      if (py > canvas.height * (1 - p) && this.offsetY < this.maxOffsetY) {
        this.offsetY++;
      } else if (py < canvas.height * p && this.offsetY > 0) {
        this.offsetY--;
      }
    }
  }

  const game = new Game(dungeonMap);
  game.draw();

  // game.select(game.player.x, game.player.y);

});
