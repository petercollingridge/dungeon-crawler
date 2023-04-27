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

  class UI {
    constructor(game) {
      this.game = game;
      this.header = document.getElementById('sidebar-header');
      this.contents = document.getElementById('inspector-contents');
      this.button = document.getElementById('sidebar-btn');

      this.xpBar = document.getElementById('xp-bar');
      this.moveBar = document.getElementById('move-bar');
      this.healthBar = document.getElementById('health-bar');

      this.statsTypes = [
        'level  ',
        'xp',
        'gold',
        'speed',
        'moveRemaining',
        'attackValue',
        'defendValue',
        'health'
      ];

      this.button.disabled = true;
      this.button.addEventListener('click', () => {
        this.game.startEnemyTurn();
        this.button.disabled = true;
        this.button.innerHTML = 'Enemy turn';
      });
    }

    update() {
      this._update_bars();

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

    _update_bars() {
      const player = this.game.dungeon.player;
      this._update_bar(this.xpBar, player, 'xp', 'targetXP');
      this._update_bar(this.moveBar, player, 'moveRemaining', 'speed');
      this._update_bar(this.healthBar, player, 'health', 'maxHealth');
    }

    _update_bar(bar, player, key1, key2) {
      const percent = Math.round(100 * player[key1] / player[key2]);
      bar.style.width = `${percent}%`;
      bar.innerHTML = player[key1] || "";
    }
  }

  class Dungeon {
    constructor(game, map) {
      this.game = game;
      this.maxX = map[0].length;
      this.maxY = map.length;
      this.screenX = Math.ceil(canvas.width / TILE_SIZE);
      this.screenY = Math.ceil(canvas.height / TILE_SIZE);
      this.enemies = [];
      this.drawCount = 0;

      this.tiles = [0,1,2,3,4,5,6,7,8,9].map((n) => document.getElementById(`tile-${n}`));

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
            const img = this.tiles[randInt(10) - 1];
            const tile = { type: 'floor', img };
            tileRow.push(tile);
            // Add tile contents
            if (mapRow[x] === '@') {
              this.player = new Player(game, x, y, STATS.player);
              tile.content = this.player;
            } else if (mapRow[x] === '1') {
              const enemy = new Goblin(game, x, y, STATS.goblin);
              this.enemies.push(enemy);
              tile.content = enemy;
            } else if (mapRow[x] === '2') {
              const enemy = new Orc(game, x, y, STATS.orc);
              this.enemies.push(enemy);
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

          const tileX = x * TILE_SIZE;

          // Tile visible this time are fully visible, otherwise they are faded
          const opacity = tile.visible === this.drawCount ? 1 : 0.5;
          if (tile.type === 'wall') {
            ctx.fillStyle = `rgb(100, 70, 20, ${opacity})`;
            ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
          } else {
            ctx.drawImage(tile.img, tileX, tileY);
            if (tile.visible !== this.drawCount ) {
              ctx.fillStyle = 'rgb(0, 0, 0, 0.6)';
              ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
            }
          }

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
        const tile = this.map[y][x];

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
        if (tile.type === 'wall') {
          tile.visible = this.drawCount;
          continue;
        }

        if (!visible) {
          continue;
        }

        // Mark tile as visible
        tile.visible = this.drawCount;
        visitedTiles[`${x},${y}`] = true;

        // Enemies on tile are seen
        if (tile.content && tile.content.type === 'enemy') {
          tile.content.seen = true;
        }

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

    checkIfBlocked(x, y) {
      // Check map bounds
      if (y < 0 || y >= this.maxY || x < 0 || x >= this.maxX) {
        return true;
      }

      // Hit wall
      if (this.map[y][x].type === 'wall') {
        return true;
      }

      const content = this.map[y][x].content;
      if (content) {
        return content;
      }

      return false;
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

    removeCharacter(character) {
      // Remove from map
      this.map[character.y][character.x].content = false;
      // Remove from enemy list
      const index = this.enemies.indexOf(character);
      if (index > -1) {
        this.enemies.splice(index, 1);
      }
    }
  }

  // Overall controller of game logic
  class Game {
    constructor(map) {
      this.UI = new UI(this);
      this.inputHandler = new InputHandler(this);
      this.dungeon = new Dungeon(this, map);
      this.textController = new TextController(this);

      this.offsetX = 0;
      this.offsetY = 0;
      this.maxOffsetX = this.dungeon.maxX - this.dungeon.screenX;
      this.maxOffsetY = this.dungeon.maxY - this.dungeon.screenY;
    }

    draw() {
      this._findOffset();
      this.dungeon.draw(ctx, this.offsetX, this.offsetY);
      this.textController.draw(ctx);
    }

    update(dt) {
      this.UI.update();
      this.textController.update(dt);
    }

    addText(x, y, text, colour) {
      this.textController.add(x, y, text, colour);
    }

    startPlayerTurn() {
      console.log('Start player turn');
      this.dungeon.player.resetMoves();
    }

    endPlayerTurn() {
      console.log('End player turn');
      this.UI.button.disabled = false;
      this.UI.button.focus();
    }

    startEnemyTurn() {
      console.log('Start enemy turn');

      // Only consider enemies that have been seen
      const activeEnemies = this.dungeon.enemies.filter((enemy) => enemy.seen);
      activeEnemies.forEach((enemy) => enemy.resetMoves());

      this.enemyTurn(activeEnemies);
    }

    enemyTurn(activeEnemies) {
      const player = this.dungeon.player;

      // Sort so we move the closest first
      activeEnemies = activeEnemies.sort(
        (a, b) => taxicabDist(a, player) - taxicabDist(b, player)
      );
      
      // Move enemies
      const stillActiveEnemies = [];
      activeEnemies.forEach((enemy) => {
        enemy.calculateMove();
        if (enemy.moveRemaining > 0) {
          stillActiveEnemies.push(enemy);
        }
      })

      if (stillActiveEnemies.length === 0) {
        this.endEnemyTurn();
      } else {
        // Enemy moves again in half a second
        setTimeout(() => this.enemyTurn(stillActiveEnemies), 300);
      }
    }

    endEnemyTurn() {
      console.log('End enemy turn');
      this.UI.button.innerHTML = 'End turn';
      this.startPlayerTurn();
    }

    gameOver() {
      console.log('Game Over');
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
  let lastTime = 0;

  // Animation loop
  function animate(timeStamp) {
    const dt = timeStamp - lastTime;
    lastTime = timeStamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.update(dt);
    game.draw(ctx);
    requestAnimationFrame(animate);
  }

  animate(0); 

  // game.select(game.player.x, game.player.y);

});
