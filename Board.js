/*
  Simple logic for Tantilla
  Note - tries as a formal "class" but that has issues...
*/

function Board(data) {

  // limitation to only 26 enemy snakes
  const enemyS = "abcdefghijklmnopqrstuvwxyz";
  const charCodeOfa = 'a'.charCodeAt(0);

  const urData = data;
  const urBoard = data.board;
  const you = data.you;

  const grid = createGrid();

  return {
    urData,
    urBoard,
    gridToString: () => _gridToString(urBoard, grid),
    degreesOfFreedom,
    distanceFromCenter,
    enemySnakes,
    isOnBoard,
    hostileSnakeAt,
    isEmpty,
    isFood,
    isMe,
    threatenedPoints,
  }

  function distanceFromCenter(p) {
    let center = { x: urBoard.width/2, y: urBoard.height/2};
    return cityBlocksBetween(p, center);
  }

  function isOnBoard(p) {
    return (p.x >= 0) && (p.y >= 0) &&
      (p.x < urBoard.width) && (p.y < urBoard.height);
  }

// TODO - the enemy tail is actually a safe point!
  function hostileSnakeAt(p) {
    let hostile = null;
    let n = grid[p.x][p.y].charCodeAt(0) - charCodeOfa;
    if (n >= 0) {
      hostile = urBoard.snakes[n];
      if (samePoints(p, snakeTail(hostile)))
        hostile = null;
    } 
    return hostile;
  }

  function isEmpty(p) {
    return grid[p.x][p.y] === ' ';
  }

  function isFood(p) {
    return grid[p.x][p.y] === 'F';
  }

  function isMe(p) {
    return (grid[p.x][p.y] === 'M');  // maybe check for tail???
  }

  /**
    how many "safe" squares (0-4) are around this point?
    "Safe" = food or empty
  **/
  function degreesOfFreedom(p) {
    let onBoard = possibleMoves(p).filter(isOnBoard);
    let empties = onBoard.filter(isEmpty).length;
    let food = onBoard.filter(isFood).length;
    return empties + food;  // could play with weights...
  }

  function distanceFromEdge(p) {
    return Math.min(
      p.x,
      p.y,
      urBoard.width-p.x-1,
      urBoard.height-p.y-1,
    )
  }

/**
 * Create a grid representing each point
 * ' ' == empty
 * 'a' - 'z' == enemy snake
 * 'F' == food
 * 'M' == me
 * 
 */
  function createGrid() {
    let grid = [];
    for (let x = 0; x < urBoard.width; x++) {
      grid[x] = Array(urBoard.height).fill(' ');
    }

    let enemy = 0;
    for (let snake of urBoard.snakes) {
      let ch = enemyS[enemy];
      for (let p of snake.body)
        grid[p.x][p.y] = ch;

      enemy++;
    }

    for (let p of you.body)  // will overwrite one snake
      grid[p.x][p.y] = 'M';

    for (let p of urBoard.food)
      grid[p.x][p.y] = 'F';

    // console.dir(grid);
    return grid;
  }

// this doesn't seem to be working...
  function _gridToString(grid) {
    let str = '';
    for (let y = 0; y < urBoard.height; y++) {
      for (let x = 0; x < urBoard.width; x++) {
        let c = grid[x][y];
        str += (c + ' ');
      }
      str += '\n';
    }

    return str;
  }

/**
 * Return a list of enemy snakes
 * opts.bigger only those >= my size
 * opts.smaller only those < my size
 * default = all
 */
  function enemySnakes(opts = {}) {
    let you = urData.you;
    let enemies = urBoard.snakes.filter((s) => s.id !== you.id);
    if (opts.bigger)
      enemies = enemies.filter((s) => s.body.length >= you.body.length);
    else if (opts.smaller)
      enemies = enemies.filter((s) => s.body.length < you.body.length);

    return enemies;
  }

/**
 * Calculate points threatened by the heads of enemy snakes
 * opts: as for enemySnakes()
 * Points will be duplicated if more than one enemy threatens it.
 */
  function threatenedPoints(opts) {
    let threatened = [];
    let enemy = enemySnakes(opts);
    for (snake of enemy) {
      moves = possibleMoves(snake.body[0]);
      threatened = threatened.concat(moves);
    }
   
    return threatened;
  }
}


function samePoints(p1, p2) { return (p1.x === p2.x) && (p1.y === p2.y); }
function cityBlocksBetween(p1, p2) { return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y); }

// curries of the 2-arg functions
function samePoint(p1) {
  return function(p2) {
    return (p1.x === p2.x) && (p1.y === p2.y);
  }
}

function cityBlocksFrom(p1) {
  return function(p2) {
    return Math.abs(p1.x-p2.x) + Math.abs(p1.y-p2.y);
  }
}

/**
 * Add a property (default = .distance) to all of toPoints
 */
function addDistances(fromPoint, toPoints, key='distance') {
  let distanceFn = cityBlocksFrom(fromPoint);
  toPoints.forEach((p) => p[key] = distanceFn(p));
  return toPoints;
}

// 4 possible moves from point p
function possibleMoves(p) {
  return [
    { dir: 'right', x: p.x + 1, y: p.y, score: 0 },
    { dir: 'left',  x: p.x - 1, y: p.y, score: 0 },
    { dir: 'up',    x: p.x, y: p.y - 1, score: 0 },
    { dir: 'down',  x: p.x, y: p.y + 1, score: 0 },
  ];
}


function snakeHead(snake) { return snake.body[0]; }
function snakeTail(snake) { return snake.body[snake.body.length-1]; }


module.exports = { Board,
  addDistances, cityBlocksBetween, cityBlocksFrom,
  possibleMoves, samePoint, samePoints,
  snakeHead, snakeTail }
