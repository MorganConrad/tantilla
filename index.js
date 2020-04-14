/*
  A BattleSnake @see (https://play.battlesnake.com/) written using Micro instead of Express
*/

const micro = require('micro');
const boardjs = require('./Board.js');
let config = require('./config.js');

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
    case '/ping': micro.send(res, 200, {});
                  break;
    case '/end' : micro.json(req)
                    .then((body) => console.log(body.game.id + " winner:" + body.board.snakes[0].name) )
                    .then(() => micro.send(res, 200, {}));
                  break;

    /*
      main logic here.  Note how Micro is async, there are no callbacks
      Most of their online examples use `await`, here we use promises

      Unlike Express, Nicro **does** come with body parsing built in
      You must call it explicitly, instead of implicit magic middleware
    */

    case '/move':  micro.json(req)  // parse the body as json
      .then((body) => calculateMove(body))
      .then((move) => micro.send(res, 200, { move: move.dir }) )
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


function calculateMove(inputs) {

  // calculate a lot of stuff...
  let board = boardjs.Board(inputs);
  let threatened = board.threatenedPoints({ bigger: true});

  // logging info
  let allSnakes = inputs.board.snakes;  // includes me
  let info = allSnakes.map((s) => `${s.name}  health:${s.health}  size:${s.body.length}`);
  console.log("turn " + inputs.turn + "  of game:" + inputs.game.id);
  console.log(info.join('\n'));

  // console.dir(inputs, {depth:99});

  // 4 possible moves
  let possibleMoves = boardjs.possibleMoves(inputs.you.body[0]);

  // eliminate moves that are offBoard, hit ourself, hit another snake,
  // or are in squares threatened by a larger enemy snake
  possibleMoves = possibleMoves.filter(board.isOnBoard);
  possibleMoves = possibleMoves.filter((p) => !board.isMe(p));
  possibleMoves = possibleMoves.filter((p) => !board.hostileSnakeAt(p));
  let emergencyMove = possibleMoves[0];  // accept the threat in case we have no other choice
  possibleMoves = possibleMoves.filter((p) => !containsPoint(threatened, p));

  if (possibleMoves.length < 2) {
    console.log('only ' + possibleMoves.length + ' open space');
    return possibleMoves.length ? possibleMoves[0] : emergencyMove;
  }

  // pick a strategy.  NOTE - somewhatHungry is TBD, currently calls chaseYourTail
  if (inputs.you.health < config.reallyHungry)
    possibleMoves = reallyHungry(possibleMoves, board);
  else if (inputs.you.health < config.somewhatHungry)
    possibleMoves = somewhatHungry(possibleMoves, board);
  else
    possibleMoves = chaseYourTail(possibleMoves, board);

// NOTE low scores are "better"
  console.log('after sorting the options are...')
  console.dir(possibleMoves);

  // lets be randomish if more than 1 choice
  // NOTE -if 0 choices this barfs but we are toast anyway...
  let idx = inputs.turn % possibleMoves.length;
  return possibleMoves[idx];
}


/*
  Really hungry heads towards the closest food
  but also factors in "degreesOfFreedon" (open areas) around that food
*/

function reallyHungry(possibles, board) {
  console.log("reallyHungry");
  possibles.forEach((p) => {
    let foods = boardjs.addDistances(p, board.urBoard.food);
    foods.forEach((f) => {
      let degreesOfFreedom = 1.0 + board.degreesOfFreedom(f);
      f.score = (f.distance+1) / degreesOfFreedom;  // high degress of freedom = better
    })

    foods.sort((a , b) => a.score - b.score);
    p.score = foods[0].score;  // score for that move  LOW = best!
  });

  return sortAndTrim(possibles);
}

// TODO but for now chaseYouTail works well...
function somewhatHungry(possibles, board) {
  return chaseYourTail(possibles, board);
}

/*
  When not hungry, chase you tail
    - avoid food
    - look for "open" areas with high degreesOfFreedom
*/
function chaseYourTail(possibles, board) {
  console.log("chaseYourTail");
  let tail = boardjs.snakeTail(board.urData.you);

  let distFn = boardjs.cityBlocksFrom(tail);
  possibles.forEach((p) => {
    let distanceToTail = distFn(p) + 1;
    let degreesOfFreedom = 1.0 + board.degreesOfFreedom(p);
    let avoidFood = board.isFood(p) ? 2 : 1;  // TODO - put these "fudge factors" in config.js
    let likeTheCenter = 1; // this didn't help...  board.distanceFromCenter(p) + 2;
    p.score = likeTheCenter * avoidFood * distanceToTail / degreesOfFreedom;
  });

  return sortAndTrim(possibles);
}


// 0 low -> length-1 high  low is best
function sortAndTrim(possibles, key = 'score') {
  possibles.sort((a , b) => a[key] - b[key]);
  let best = possibles[0][key];
  return possibles.filter((p) => p[key] === best);
}


function containsPoint(points, point) {
  return points.some((p) => boardjs.samePoints(p, point));
}
