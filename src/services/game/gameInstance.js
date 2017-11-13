const GameBoard = require('./GameBoard')
const knex = require('../data').default
const winston = require('winston')

const VALID_GAME_STATES = {
    'CREATING': {
        description: 'Creating'
    },
    'WAITING': {
        description: 'Waiting'
    },
    'SETUP': {
        description: 'Setup'
    },
    'INPROGRESS': {
        description: 'In-Progress'
    },
    'COMPLETED': {
        description: 'Completed'
    }
}

class GameInstance {
    constructor(config = {}){
        
        this.gameid = config.gameid || 0
        this.datecreated = null

        this.currentState = 'CREATING'
        this.currentPlayer = false
        
        this.players = {
            // Structure....
            // 1: { board: new GameBoard(), data: {}, socket: null }
        }
    }

    transitionState(newState){
        if ( newState in VALID_GAME_STATES){
            this.currentState = newState

            knex('game').update({ status: newState}).where({ gameid: this.gameid})
                .catch((e) => {
                    winston.log('warn', 'Unable to transition state', { gameid: this.gameid, state: newState}, e)
                })

            const event = { 
                gameid: this.gameid, 
                datecreated: knex.fn.now(), 
                action: {
                    gameid: this.gameid,
                    type: 'STATE_CHANGE',
                    state: newState
                }
            }
            
            knex('game_action').insert(event).catch((e) => {
                winston.log('warn', 'Unable to log state transition', event.action, e)
            })

            return newState
        } 
        
        throw new Error('Invalid game state')
    }

    isState(desiredState){
        return (this.currentState === desiredState)
    }

    isPlayerTurn(playerNumber){
        return (this.currentPlayer === playerNumber)
    }

    nextPlayer(){
        if (this.currentPlayer){
            const next = this.currentPlayer === 1 ? 2 : 1
            this.currentPlayer = next

            return next
        }

        throw new Error('Cannot move to next player without current player')
    }
    
    allPiecesPlaced() {
        const player1Ready = this.players[1].board.allPiecesPlaced()
        const player2Ready = this.players[2].board.allPiecesPlaced()

        return player1Ready && player2Ready
    }

    setupPieces(playerNumber, pieceSet){
        
        // The game must be in SETUP mode to place pieces
        if (isState('SETUP')){
            const player = this.players[playerNumber]
            try{

                const board = player.board.placeShips(pieceSet)
                
                const event = {
                    gameid: this.gameid, 
                    datecreated: knex.fn.now(),
                    action: {
                        gameid: this.gameid,
                        type: 'PIECES_PLACED',
                        player: player.data,
                        pieces: pieceSet
                    }
                }

                knex('game_action').insert(event).catch((e) => {
                    winston.log('warn', 'Unable to log action', event.action, e)
                })

                player.socket.json({ type: 'GAME:PIECES:ACCEPT', payload: board})

            } catch(e) {
                
                player.socket.json({ type: 'GAME:PIECES:REJECT', message: e.message})

            }

            // If both players have successfully placed all their pieces, we can transition to In-Progress
            if (allPiecesPlaced){
                this.transitionState('IN-PROGRESS')
                this.broadcastStateChange('IN-PROGRESS', 'Game can now begin!')
                this.broadcastMessage('GAME:PLAYER:TURN', 'It is player 1s turn', { player: 1 })
            }

            return true
        } else {
            player.socket.json({ type: 'GAME:PIECES:REJECT', message: 'Can only place pieces when game is in SETUP mode'})
            return false
        }

    }

    isGameOver(){
        
    }

    guessLocation(playerNumber, location){
        if (isPlayerTurn(playerNumber)){

            nextPlayer()
            return true
        }

        throw new Error('Not your turn')
    }

    broadcastStateChange(state, message = ''){
        this.broadcast({
            type: 'GAME:STATE',
            message,
            payload: {
                state
            }
        })
    }

    broadcastMessage(type, message, payload = {}){
        this.broadcast({
            type: type,
            message,
            payload: payload
        })
    }

    allPlayers(){
        let players = []
        Object.keys(this.players).forEach((number) => {
            players.push(this.players[number])
        })

        return players
    }

    broadcast(data){
        this.allPlayers().forEach((player) => {
            if (player.socket)
                player.socket.json(data)
        })
    }

    addPlayerConnection(playerNumber, socket, data = {}){
        const player = {
            board: new GameBoard(),
            data: data,
            socket: socket
        }

        this.players[playerNumber] = player
        this.broadcastMessage('GAME:PLAYER:JOIN', `Player ${playerNumber} joined`, player.data)
        
        const event = {
            gameid: this.gameid,
            datecreated: knex.fn.now(),
            action: {
                gameid: this.gameid,
                type: 'PLAYER_JOIN',
                player: player.data
            }
        }

        knex('game_action').insert(event).catch((err) => {
            winston.log('warn', 'Unable to log action', event.action, e)
        })

        if (this.players[1] && this.players[2]){
            this.transitionState('SETUP')
            this.broadcastStateChange('SETUP', 'Setup your pieces!')
        } else {
            this.transitionState('WAITING')
            this.broadcastStateChange('WAITING', 'Waiting for all players to join!')
        }
    }

}

module.exports = GameInstance