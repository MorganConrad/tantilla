# Tantilla

![Tantilla](https://upload.wikimedia.org/wikipedia/commons/9/9c/Tantilla_gracilis.jpg)

The [tantilla](https://en.wikipedia.org/wiki/Tantilla) is a family of small, secretive snakes.


## A cautious [Battlesnake AI](https://battlesnake.io) written in Javascript using NodeJS / micro.

  1. Don't go outside the ring or hit other snake bodies (including yourself)
  2. If health is low, go get food
  3. Otherwise, "chase your tail".  While doing so:
     - avoid food
     - avoid squares threatened by larger enemy snake heads
     - favor squares which have many open squares ("degreed of freedom") around them

### Room for improvement
 - The search is only one ply deep.
 - There are various "weights" and "fudge factors" that could be adjusted

### Try it

 - Running on repl.it: [Tantilla](https://Tantilla--morganconrad.repl.co)
 - or find it as a "Public Battlesnake" via morganconrad/Tantilla when you [Create a Game](https://play.battlesnake.com/account/games/create/) at play.battlesnake.com
