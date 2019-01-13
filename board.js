
function board(data) {

  const board = data.board;
  const you = data.you;
  let lastHostile;  // temp cache for some efficieny

  return {

    // predicates for use by 
    isFood: function isFood(p) { return board.food.some(samePointAs(p)); },
    isMe:   function isMe(p)   { return you.body.some(samePointAs(p)) },
    isOffBoard: function isOffBoard(p) {
      return (p.x < 0) || (p.y < 0) || 
             (p.x >= board.width) || (p.y >= board.height);
    },
    
    isHostileSnake: function isHostileSnake(p) {
      const samePoint = samePointAs(p);
      let hostiles = board.snakes.filter((snake) => snake.id !== you.id);
      lastHostile = hostiles.find((hostile) => hostile.body.some(samePoint));
      return lastHostile;
    },

    // warning - only call this after calling isHostileSnake(p)!
    isEdibleHostile: function isEdibleHostile(p) {
      return lastHostile && samePointAs(p)(lastHostile.body[0]);
    },

    you: data.you,
    urdata: data
  }

}


function samePointAs(p1) {
  return function(p2) {
    return (p1.x === p2.x) && (p1.y === p2.y);
  }
}

function distance2(p1) {
  return function(p2) {
    let dx = p1.x - p2.x;
    let dy = p1.y - p2.y;
    return dx*dx + dy*dy;
  }
}

function distanceCityBlock(p1) {
  return function(p2) {
    return Math.abs(p1.x-p2.x) + Math.abs(p1.y-p2.y);
  }
}

module.exports = { board, samePointAs, distance2, distanceCityBlock} ;