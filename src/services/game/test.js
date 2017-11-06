const GameInstance = require('./gameInstance')
const GameEventService = require('./gameEventService')

const game = new GameInstance(new GameEventService())

game.player2()
    .placePiece('CARRIER', {x: 3, y: 3, d: 'E'})
    .placePiece('BATTLESHIP', {x: 2, y: 7, d: 'N'})

game.player1()
    .placePiece('DESTROYER', {x: 5, y: 5, d: 'N'})

game.player2()
    .guess({ x: 5, y: 4})

game.player1()
    .guess({ x: 5, y: 4})

game.player2()
    .guess({ x: 5, y: 3})