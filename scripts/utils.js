function checkCollision(arr, x, y) {
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (item.x === x && item.y === y) {
      return item;
    }
  }
}
