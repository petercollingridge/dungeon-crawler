const abs = Math.abs;

const DELTAS = [[-1, 0], [0, 1], [1, 0], [0, -1]];

function checkCollision(arr, x, y) {
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (item.x === x && item.y === y) {
      return item;
    }
  }
}

function taxicabDist(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Random number in the range 1 - n
function randInt(n) {
  return Math.floor(Math.random() * n) + 1;
}
