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

        this.currentState = config.currentState || 'CREATING'
        this.currentPlayer = config.currentPlayer || false
        
        this.players = {
            // Structure....
            // 1: { board: new GameBoard(), data: {}, socket: null }
        }

        if (config.players){
            this.fillExistingPlayers(config)
        }
    }

    async persist(){
        const state = this.toJson()
        
        try {
            const res = await knex('game').update({ state }).where({id: this.gameid})
            return true
        } catch (e) {
            winston.log('warn', 'Could not persist in-memory game: ', e, state)
            throw new Erro('Could not persist game')
        }
        
    }

    toJson(){
        let data = {
            gameid: this.gameid,
            currentState: this.currentState,
            currentPlayer: this.currentPlayer,
            players: {}
        }

        Object.keys(this.players).forEach((playerNumber) => {
            const player = this.players[playerNumber]
            const rep = {
                board: player.board.toJson(),
                data: player.data
            }

            data.players[playerNumber] = rep
        })

        return data
    }

    fillExistingPlayers(config = {}){
        
        Object.keys(config.players).forEach((playerNumber) => {
            const player = config.players[playerNumber]

            const playerData = {
                board: new GameBoard(player.board),
                data: player.data
            }

            this.players[playerNumber] = playerData
        })
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

    setCurrentPlayer(playerNumber){
        this.currentPlayer = playerNumber
        this.broadcastMessage('GAME:PLAYER:TURN', `It is player ${playerNumber} turn`, { player: playerNumber })
    }

    nextPlayer(){
        if (this.currentPlayer){
            this.currentPlayer = this.getOpponent()
            return this.currentPlayer
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
                this.transitionState('INPROGRESS')
                this.broadcastStateChange('INPROGRESS', 'Game can now begin!')
                this.setCurrentPlayer(1)
            }

            return true
        } else {
            player.socket.json({ type: 'GAME:PIECES:REJECT', message: 'Can only place pieces when game is in SETUP mode'})
            return false
        }

    }

    isGameOver(){
        const player1Lost = this.players[1].board.isGameOver()
        const player2Lost = this.players[2].board.isGameOver()

        // If neither player lost, the game is still going, return false
        if (!player1Lost && !player2Lost)
            return false
        
        
        let event = {
            gameid: this.gameid,
            datecreated: knex.fn.now(),
            action: {
                gameid: this.gameid,
                type: 'GAME_OVER'
            }
        }
        
        //If player x lost, then player y won
        if (player1Lost){
            event.action.winner = this.players[2].data
        }
        
        if (player2Lost){
            event.action.winner = this.players[1].data
        }

        //Log game over
        knex('game_action').insert(event).catch((e) => {
            winston.log('warn', 'Unable to log game_over event', event.action, e)
        })
        
        
        //Transition to completed
        this.transitionState('COMPLETED')

        //Broadcast gameover
        this.broadcastMessage('GAME:OVER', `Player ${player1Lost ? 2 : 1} won!`, { winner: event.action.winner})

        return true

    }

    getOpponent(){
        return this.currentPlayer === 1 ? 2 : 1
    }
    getCurrentPlayerTargetBoard(){
        return this.players[this.getOpponent()].board
    }

    guessLocation(playerNumber, location){
        if (isPlayerTurn(playerNumber) && isState('INPROGRESS')){
            try {
                // Get board opposite current player and guess the location
                const board = this.getCurrentPlayerTargetBoard()
                let response = board.guessLocation(location)
                
                //Accept their guess and send the result
                this.messageToPlayer(playerNumber, 'GAME:GUESS:ACCEPT', '', response)
                
                //Swap views and return the response to the opponent
                response.board = board.view()
                this.messageToPlayer(this.getOpponent(), 'GAME:GUESS:OPPONENT', '', response)

                
                //Record the event
                const event = {
                    gameid: this.gameid,
                    datecreated: knex.fn.now(),
                    action: {
                        gameid: this.gameid,
                        type: 'PLAYER_GUESS',
                        player: this.players[playerNumber].data,
                        response: response
                    }
                }
        
                knex('game_action').insert(event).catch((e) => {
                    winston.log('warn', 'Unable to log player guess', event.action, e)
                })
                
                
                //Switch Turns if game isnt over
                if (!this.isGameOver())
                    nextPlayer()
            } catch (e) {
                this.messageToPlayer(playerNumber, 'GAME:GUESS:REJECT', e.message)
            }
        } else {
            this.messageToPlayer(playerNumber, 'GAME:GUESS:REJECT', 'Not your turn!')
        }
    }

    messageToPlayer(playerNumber, type = '', message = '', playload = {}){
        this.players[playerNumber].socket.json({
            type,
            message,
            payload
        })
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

    isPlayerHere(playerNumber){

        const player = this.players[playerNumber]
        
        // Is player registered & socket active
        if (player && player.socket)
            return true

        return false
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