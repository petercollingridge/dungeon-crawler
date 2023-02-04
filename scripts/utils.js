const DELTAS = [[-1, 0], [0, 1], [1, 0], [0, -1]];

function checkCollision(arr, x, y) {
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (item.x === x && item.y === y) {
      return item;
    }
  }
}
