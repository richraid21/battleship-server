const GameInstance = require('../../../src/services/game/GameInstance')
import _ from 'lodash'

describe('Game Instance Unit Tests', () => {

    const sockets = {
        player1: {
            json: jest.fn()
        },
        player2: {
            json: jest.fn()   
        }
    }
    
    beforeEach(() => {
        sockets.player1.json.mockClear()
        sockets.player2.json.mockClear()
    })

    const game = new GameInstance({gameid: 10000})

    const player1 = sockets.player1.json
    const player2 = sockets.player2.json

    it('Should initialize', () => {
        expect(game.currentState).toBe('CREATING')
        expect(Object.keys(game.players).length).toBe(0)
    })
    
    it('Should allow a player to join', async () => {
        expect.assertions(3)
        await game.addPlayerConnection(1, sockets.player1)
        
        const playerJoined = {"message": "Player 1 joined", "payload": {}, "type": "GAME:PLAYER:JOIN"}
        expect(player1).toBeCalledWith(playerJoined)
        
        const gameStateWaiting = {"message": "Waiting for all players to join!", "payload": {"state": "WAITING"}, "type": "GAME:STATE"}
        expect(player1).toBeCalledWith(gameStateWaiting)

        expect(game.currentState).toBe('WAITING')
    })
    
    it('Should allow a second player to join', async () => {
        expect.assertions(6)
        await game.addPlayerConnection(2, sockets.player2)

        const playerJoined = {"message": "Player 2 joined", "payload": {}, "type": "GAME:PLAYER:JOIN"}
        expect(player1).toBeCalledWith(playerJoined)
        expect(player2).toBeCalledWith(playerJoined)
        
        const gameStateWaiting = {"message": "Setup your pieces!", "payload": {"state": "SETUP"}, "type": "GAME:STATE"}
        expect(player1).toBeCalledWith(gameStateWaiting)
        expect(player2).toBeCalledWith(gameStateWaiting)

        expect(game.currentState).toBe('SETUP')
        expect(game.currentPlayer).toBe(false)

    })

    it('Should accept a valid ship layout in pieces', async () => {
        expect.assertions(7)
        
        const ships = [
            {name: 'CARRIER', points: [{x: 1, y: 1}, {x: 1, y:2}, {x: 1, y:3}, {x: 1, y:4}, {x: 1, y:5}]}
        ]

        const ships2 = [
            {name: 'BATTLESHIP', points: [{x: 2, y: 1}, {x: 2, y:2}, {x: 2, y:3}, {x: 2, y:4}]}
        ]

        const ships3 = [
            {name: 'CRUISER', points: [{x: 3, y: 1}, {x: 3, y:2}, {x: 3, y:3}]},
            {name: 'SUBMARINE', points: [{x: 4, y: 1}, {x: 4, y:2}, {x: 4, y:3}]},
            {name: 'DESTROYER', points: [{x: 5, y: 1}, {x: 5, y:2}]}
        ]

        await game.setupPieces(1, ships)
        await game.setupPieces(1, ships2)
        await game.setupPieces(1, ships3)

        // 3 times for 3 acceptances
        
        expect(player1).toHaveBeenCalledTimes(3)

        const res1 = player1.mock.calls[0][0]
        expect(res1.type).toBe('GAME:PIECES:ACCEPT')
        expect(res1.payload.piecesPlaced).toBe(1)

        const res2 = player1.mock.calls[1][0]
        expect(res2.type).toBe('GAME:PIECES:ACCEPT')
        expect(res2.payload.piecesPlaced).toBe(2)

        const res3 = player1.mock.calls[2][0]
        expect(res3.type).toBe('GAME:PIECES:ACCEPT')
        expect(res3.payload.piecesPlaced).toBe(5)
    })

    it('Should accept a valid ship layout as one call', async () => {
        expect.assertions(10)

        const ships = [
            {name: 'CARRIER', points: [{x: 1, y: 1}, {x: 1, y:2}, {x: 1, y:3}, {x: 1, y:4}, {x: 1, y:5}]},
            {name: 'BATTLESHIP', points: [{x: 2, y: 1}, {x: 2, y:2}, {x: 2, y:3}, {x: 2, y:4}]},
            {name: 'CRUISER', points: [{x: 3, y: 1}, {x: 3, y:2}, {x: 3, y:3}]},
            {name: 'SUBMARINE', points: [{x: 4, y: 1}, {x: 4, y:2}, {x: 4, y:3}]},
            {name: 'DESTROYER', points: [{x: 5, y: 1}, {x: 5, y:2}]}
        ]

        await game.setupPieces(2, ships)

        expect(player2).toHaveBeenCalledTimes(3)
        expect(player1).toHaveBeenCalledTimes(2)

        // First call is acceptance of pieces
        const res = player2.mock.calls[0][0]
        expect(res.type).toBe('GAME:PIECES:ACCEPT')
        expect(res.payload.piecesPlaced).toBe(5)

        // game state transition
        const state = { type: 'GAME:STATE', message: 'Game can now begin!', payload: { state: 'INPROGRESS' } }
        expect(player1).toBeCalledWith(state)
        expect(player2).toBeCalledWith(state)

        // Player turn broadcast
        const turn = { type: 'GAME:PLAYER:TURN', message: 'It is player 1 turn', payload: { player: {} } }
        expect(player1).toBeCalledWith(turn)
        expect(player2).toBeCalledWith(turn)
        
        // Ensure the game is in the proper state
        expect(game.currentPlayer).toBe(1)
        expect(game.currentState).toBe('INPROGRESS')
        
    })

    it('Should reject a guess from non-players turn', async () => {
        expect.assertions(1)

        await game.guessLocation(2, {x: 1, y: 1})

        const reject = {"message": "Not your turn!", "payload": {}, "type": "GAME:GUESS:REJECT"}
        expect(player2).toBeCalledWith(reject)
    })

    it('Should accept a guess when it is the players turn', async () => {
        expect.assertions(7)

        await game.guessLocation(1, {x: 1, y: 1})

        const accept = player1.mock.calls[0][0]

        expect(accept.type).toBe('GAME:GUESS:ACCEPT')
        expect(accept.payload.result).toBe('HIT')

        const opponentNotification = player2.mock.calls[0][0]
        expect(opponentNotification.type).toBe('GAME:GUESS:OPPONENT')
        expect(opponentNotification.payload.result).toBe('HIT')
        
        const nextPlayer = { type: 'GAME:PLAYER:TURN', message: 'It is player 2 turn', payload: { player: {} } } 
        expect(player1).toBeCalledWith(nextPlayer)
        expect(player2).toBeCalledWith(nextPlayer)
        
        expect(game.currentPlayer).toBe(2)
    })

    it('Should accept a guess and return a miss', async () => {
        expect.assertions(8)

        await game.guessLocation(2, {x: 7, y: 9})
        
        const accept = player2.mock.calls[0][0]
        expect(accept.type).toBe('GAME:GUESS:ACCEPT')
        expect(accept.payload.result).toBe('MISS')

        const opponentNotification = player1.mock.calls[0][0]
        expect(opponentNotification.type).toBe('GAME:GUESS:OPPONENT')
        expect(opponentNotification.payload.result).toBe('MISS')
        
        const nextPlayer = { type: 'GAME:PLAYER:TURN', message: 'It is player 1 turn', payload: { player: {} } } 
        expect(player1).toBeCalledWith(nextPlayer)
        expect(player2).toBeCalledWith(nextPlayer)
        
        expect(game.currentPlayer).toBe(1)
        expect(game.currentState).toBe('INPROGRESS')
    })

})