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
      this.map = map;
      this.maxX = map[0].length;
      this.maxY = map.length;
      this.screenX = Math.ceil(canvas.width / TILE_SIZE);
      this.screenY = Math.ceil(canvas.height / TILE_SIZE);

      // Find objects
      this.objects = [];
      for (let y = 0; y < this.maxY; y++) {
        const row = map[y];
        for (let x = 0; x < this.maxX; x++) {
          if (row[x] === '@') {
            this.player = new Player(game, x, y, STATS.player);
            this.objects.push(this.player);
          } else if (row[x] === '1') {
            const enemy = new Goblin(game, x, y, STATS.goblin);
            this.objects.push(enemy);
          } else if (row[x] === '*') {
            this.objects.push(new Gold(x, y, 25));
          }
        }
      }

      // Create a 2D array of objects to represent the map
      // this.grid = [];
      // for (let y = 0; y < this.maxY; y++) {
      //   const row = [];
      //   for (let x = 0; x < this.maxX; x++) {
      //     if (map[y][x] === '#') {
      //       row.push({ type: 'wall '});
      //     } else {
      //       row.push({ type: 'floor '});
      //     }
      //   }
      //   this.grid.push(row);
      // }

      // console.log(this.grid);
    }

    draw(ctx, offsetX, offsetY) {
      this._drawMap(ctx, offsetX, offsetY);
      // this.objects.forEach((obj) => obj.draw(ctx, offsetX, offsetY));
    }

    _drawMap(ctx, offsetX, offsetY) {
      // const visibleTiles = this._findVisibleTiles();

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

      this._findVisibleTiles(ctx);
      // visibleTiles.forEach(([x, y], i) => {
      //   const x2 = (x + 0.25) * TILE_SIZE;
      //   const y2 = (y + 0.25) * TILE_SIZE;
      //   ctx.fillStyle = 'rgb(250, 40, 40, 0.5)';
      //   ctx.fillRect(x2, y2, TILE_SIZE / 2, TILE_SIZE / 2);

      //   const x3 = (x + 0.4) * TILE_SIZE;
      //   const y3 = (y + 0.6) * TILE_SIZE;
      //   ctx.fillStyle = '#222';
      //   ctx.fillText(i, x3, y3);
      // });
    }


    _findVisibleTiles(ctx) {
      const px = this.player.x;
      const py = this.player.y;

      const frontier = [[px, py]];
      const visibleTiles = [];

      // Map a coordinate to whether a tile is visible
      const visitedTiles = {};
      visitedTiles[`${px},${py}`] = true;

      const cycles = 100;
      let i = 0;

      while (frontier.length) {
        if (i++ >= cycles) { break; }
        const [x, y] = frontier.shift();
        console.log(`${i}: (${x}, ${y})`);

        // TODO: Test if visible
        const dx = x - px;
        const dy = y - py;
        let visible = false
        console.log(dx, dy);

        if (Math.abs(dx) > Math.abs(dy)) {
          console.log('dx');
          console.log(`Test ${x - Math.sign(dx)},${y}`);
          visible = visitedTiles[`${x - Math.sign(dx)},${y}`]
        } else if (Math.abs(dy) > Math.abs(dx)) {
          console.log(`Test ${x},${y - Math.sign(dy)}`);
          visible = visitedTiles[`${x},${y - Math.sign(dy)}`]
        } else if (dx === 0) {
          // dx === 0 and dx === dy, so this is where the player is
          visible = true;
        } else {
          visible = visitedTiles[`${x - Math.sign(dx)},${y - Math.sign(dy)}`]
        }

        if (!visible) {
          continue;
        }

        visibleTiles.push([x, y]);

        // Walls are visible but do not propagate visibility
        if (this.map[y][x] === '#') { 
          continue;
        }

        visitedTiles[`${x},${y}`] = visible;

        // console.log('neighbours');
        // Add neighbours to frontier
        for (let i = 0; i < 4; i++) {
          const [dx, dy] = DELTAS[i];
          const x2 = x + dx;
          const y2 = y + dy;
          if (x2 >= 0 && x2 <= this.maxX && y2 >= 0 && y2 <= this.maxY) {
            if (visitedTiles[`${x2},${y2}`] === undefined) {
              // console.log(`${x2},${y2}`);
              // console.log(visitedTiles);

              // Mark as visited so we don't check again
              // But set as not visible as we assume it's not initially
              visitedTiles[`${x2},${y2}`] = false;
              frontier.push([x2, y2]);
            }
          }
        }
      }

      // console.log(visitedTiles);
      // console.log(visibleTiles);
      const x2 = (px + 0.1) * TILE_SIZE;
      const y2 = (py + 0.1) * TILE_SIZE;
      ctx.fillStyle = 'rgb(250, 40, 40, 0.85)';
      ctx.fillRect(x2, y2, TILE_SIZE * 0.8, TILE_SIZE * 0.8);

      for (const tile in visitedTiles) {
        // console.log(tile, visitedTiles[tile]); 
        const [x, y] = tile.split(',');
        const x2 = (parseInt(x) + 0.25) * TILE_SIZE;
        const y2 = (parseInt(y) + 0.25) * TILE_SIZE;
        if (visitedTiles[tile]) {
          ctx.fillStyle = 'rgb(250, 40, 40, 0.5)';
        } else if (visitedTiles[tile] === false) {
          ctx.fillStyle = 'rgb(0, 0, 80, 0.5)';
        }
        ctx.fillRect(x2, y2, TILE_SIZE / 2, TILE_SIZE / 2);
      }

      return visibleTiles;
    }

    canMoveTo(x, y) {
      // Check map bounds
      if (y < 0 || y >= this.maxY) {
        return false;
      }
      if (x < 0 || x >= this.maxX) {
        return false;
      }

      // Hit wall
      if (this.map[y][x] === '#') {
        return false;
      }

      // Check for collision with enemies and objects
      const hitItem = checkCollision(this.objects, x, y);
      if (hitItem) {
        if (!hitItem.canPickUp) {
          return false;
        }
        return hitItem;
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

      if (this.map[y][x] === '#') {
        return 'Wall';
      }

      const item = checkCollision(this.objects, x, y);
      if (item) {
        return item;
      } else {
        return 'Floor';
      }
    }
  }

  class UI {
    constructor(game) {
      this.game = game;
      this.header = document.getElementById('sidebar-header');
      this.contents = document.getElementById('sidebar-contents');
      this.statsTypes = ['xp', 'gold', 'attack', 'defend'];
    }

    update(obj) {
      this.contents.innerHTML = '';

      if (typeof obj === 'string') {
        this.header.innerText = obj;
      } else {
        this.header.innerText = obj.name;
        const ul = document.createElement('ul');
        
        this.statsTypes.forEach((stat) => {
          if (obj[stat] !== undefined) {
            const li = document.createElement('li');
            li.innerText = `${stat}: ${obj[stat]}`;
            ul.appendChild(li);
          }
        });

        this.contents.appendChild(ul);
      }
    }
  }

  class Game {
    constructor(map) {
      this.UI = new UI(this);
      this.inputHandler = new InputHandler(this);
      this.dungeon = new Dungeon(this, map);

      this.offsetX = 0;
      this.offsetY = 0;
      this.maxOffsetX = this.dungeon.maxX - this.dungeon.screenX;
      this.maxOffsetY = this.dungeon.maxY - this.dungeon.screenY;
    }

    draw() {
      this._findOffset();
      this.dungeon.draw(ctx, this.offsetX, this.offsetY);
    }

    click(x, y) {
      const tileX = Math.floor(x / TILE_SIZE) + this.offsetX;
      const tileY = Math.floor(y / TILE_SIZE) + this.offsetY;
      const clickedItem = this.dungeon.getObjectAt(tileX, tileY);
      
      this.UI.update(clickedItem);
    }

    _findOffset() {
      const px = (this.dungeon.player.x - this.offsetX) * TILE_SIZE;
      const py = (this.dungeon.player.y - this.offsetY) * TILE_SIZE;
      
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

  // game.select(game.player.x, game.player.y);

});
