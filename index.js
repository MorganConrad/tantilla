/*
  A basic Snake with a little logic, written using Micro instead of Express
*/

const micro = require('micro');
const boardjs = require('./board.js');
let config = require('./config.js');

// console.dir(config);

const DEFAULT_COLOR = '#666666'

// The main handler function
async function handler(req, res) {
  if (req.method !== 'POST') {
     return micro.send(res, 405, { error: "invalid method: " + req.method })
  }
    
  console.log(req.url);

/*
  Unlike Express, Micro doesn't come with routing.  There are many on the
  Awesome Micro site (https://github.com/amio/awesome-micro)
  and if you wanted to handle queries or wildcards those would be useful
  
  Since our needs are so basic just route them ourselves
 */

  switch(req.url) {
    case '/start': micro.send(res, 200, { color: config.color || DEFAULT_COLOR }); 
                  break;
    case '/ping':
    case '/end' :  micro.send(res, 200, {});
                  break;

    /*
      main logic here.  Note how Micro is async, there are no callbacks
      Most of their online examples use `await`, here we use promises
 
      Unlike Express, Nicro **does** come with body parsing built in
      You must call it explicitly, instead of implicit magic middleware
    */

    case '/move':  micro.json(req)  // parse the body as json
                     .then((body) => calculateMove(body))
                     .then((move) => micro.send(res, 200, { move: move }) )
                     .catch((err) => console.dir(err));
                  break;
                  
    default: micro.send(res, 404, { error: "invalid URL: " + req.url}); 
  }
}

// setup the server.  One can also use the micro cli
const server = micro(handler);
const port = process.env.PORT || 3000;

server.listen(port);
console.log("listening on port " + port);
// console.dir(server);

// --- User code below ---

// Basic calculate Move with basic "try not to die" logic.
// More serious AI is delegated to rateMoves()

function calculateMove(inputs) {
   
  // console.dir(inputs, { depth: 99 });

  if (config.debug)
    console.dir(inputs, { depth: 99 });
  
  let board = boardjs.board(inputs);
  let best = onePlySearch(board, [board.you.body[0]]);
    
  return best.direction;
}


// one ply search
function onePlySearch(board, path) {
  path = path || [board.you.body[0]];
  let nowAt = path[path.length-1];

  let possibles = [
    { x: nowAt.x -1, y: nowAt.y, dx: -1, dy: 0, direction: "left", score: 0 },
    { x: nowAt.x +1, y: nowAt.y, dx: 1, dy: 0, direction: "right", score: 0 },
    { x: nowAt.x, y: nowAt.y+1, dx: 0, dy: 1, direction: "down", score: 0 },
    { x: nowAt.x, y: nowAt.y -1, dx: 0, dy: -1,direction: "up", score: 0 }
  ];

  let bestP = possibles[0];

  try {
    let rated = scoreBasedOnConfigValuations(possibles, board, config.valuations);

    if (board.you.health < config.reallyHungry)  // bias towards food...
      reallyHungry(possibles, board);

    // penalize backtracking
    else if (config.backtrackPenalty && (path.length > 1)) {
      possibles.forEach(function(p) { 
        if (path.some(boardjs.samePointAs(p))) {
          p.score += (config.backtrackPenalty);
        }
      });
    }

    rated = customRateMoves(possibles, board);
  
    rated.sort(function(p1, p2) { return p2.score - p1.score } );
    console.dir(rated);

    bestP = chooseBestRated(rated, board.you.health);
  }
  catch(e) {
    console.dir(e);
  }
    
  return bestP;
}


function scoreBasedOnConfigValuations(possibles, board, valuations) {
  Object.keys(valuations).forEach((fn) => {  // key is a board functionName
    possibles.forEach((p) => {
      if (board[fn](p))
        p.score += valuations[fn];           // value is the score to add/subtract
    })
  })

  return possibles;
}


function reallyHungry(possibles, board) {
  console.log("really hungry");
  possibles.forEach((p) => {
    let distances = board.urdata.board.food.map(boardjs.distanceCityBlock(p)).sort((a,b) => a-b);
    // console.dir(distances);
    p.score += (100.0 / distances[0]);
  });

  return possibles;
}

// your custom logic here...
function customRateMoves(possibles, inputs) {
  return possibles;
}

// if there are ties, you could something clever here
function chooseBestRated(rated, health) {
  if (health > 0)
    return rated[0];
  
  // if we are hungry, mix things up...
  const bestScore = rated[0].score;
  let same = rated.filter((r) => r.score === bestScore);
  return same[same.length-1];
}
