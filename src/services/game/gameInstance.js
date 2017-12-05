const GameBoard = require('./gameBoard')
const knex = require('../data').default
const winston = require('winston')
import _ from 'lodash'

import RankService from '../ranking/index'

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
        
        this.gameid = 0

        this.currentState = 'CREATING'
        this.currentPlayer = false
        
        this.players = {
            // Structure....
            // 1: { board: new GameBoard(), data: {}, socket: null }
        }

        if (config){
            this.setup(config)
        }

        if (config.players){
            this.fillExistingPlayers(config)
        }
    }

    async persist(){
        const state = this.toJson()

        try {
            const res = await knex('game').update({ status: this.currentState, state }).where({id: this.gameid})
            return true
        } catch (e) {
            winston.log('warn', 'Could not persist in-memory game: ', e, state)
            throw new Error('Could not persist game')
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

    setup(config){
        if (config.gameid)
            this.gameid = config.gameid
       
        if (config.currentPlayer)
            this.currentPlayer = config.currentPlayer

        if (config.currentState)
            this.currentState = config.currentState
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

    async transitionState(newState){
        if ( newState in VALID_GAME_STATES){
            this.currentState = newState

            await knex('game').update({ status: newState}).where({ id: this.gameid})
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
            
            await knex('game_action').insert(event)
            .catch((e) => {
                winston.log('warn', 'Unable to log state transition', event.action, e)
            })

            await this.persist()
            return true
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
        this.broadcastMessage(
            'GAME:PLAYER:TURN', 
            `It is player ${playerNumber} turn`, 
            { player: this.players[playerNumber].data })
    }

    nextPlayer(){
        if (this.currentPlayer){
            const next = this.getOpponent()
            this.setCurrentPlayer(next)
            return this.currentPlayer
        }

        throw new Error('Cannot move to next player without current player')
    }
    
    allPiecesPlaced() {
        const player1Ready = this.players[1].board.allPiecesPlaced()
        const player2Ready = this.players[2].board.allPiecesPlaced()

        return player1Ready && player2Ready
    }

    async setupPieces(playerNumber, pieceSet){
        
        // The game must be in SETUP mode to place pieces
        if (this.isState('SETUP')){
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

                await knex('game_action').insert(event)
                .catch((e) => {
                    winston.log('warn', 'Unable to log action', event.action, e)
                })

                await this.persist()

                player.socket.json({ type: 'GAME:PIECES:ACCEPT', payload: board})

            } catch(e) {
                
                player.socket.json({ type: 'GAME:PIECES:REJECT', message: e.message})

            }

            // If both players have successfully placed all their pieces, we can transition to In-Progress
            if (this.allPiecesPlaced()){
                await this.transitionState('INPROGRESS')
                this.broadcastStateChange('INPROGRESS', 'Game can now begin!')
                this.setCurrentPlayer(1)
            }

            return true
        } else {
			//TODO write a test for this
			this.messageToPlayer(playerNumber, 'GAME:GUESS:REJECT', 'Can only place pieces when game is in SETUP mode')
            return false
        }

    }
    _forceGameOver(){
        this._FORCE_GAME_OVER = true
    }
    async isGameOver(){
        let player1Lost = this.players[1].board.isGameOver()
        let player2Lost = this.players[2].board.isGameOver()

        // If neither player lost, the game is still going, return false
        if (this._FORCE_GAME_OVER){
            player1Lost = false
            player2Lost = true
        }

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
        let winner, loser
        if (player1Lost){
            winner = 2
            loser = 1
        }
        
        if (player2Lost){
            winner = 1
            loser = 2
        }

        event.action.winner = this.players[winner].data
        event.action.loser = this.players[loser].data

        //Log game over
        await knex('game_action').insert(event)
        .catch((e) => {
            winston.log('warn', 'Unable to log game_over event', event.action, e)
        })

        // Insert result
        await knex('game_result').insert({gameid: this.gameid, winner: event.action.winner.id, loser: event.action.loser.id}).catch((e) => {
            winston.log('warn', 'Unable to insert game_result', event.action, e)
        })

        // Update game status
        await knex('game').update({status: 'COMPLETED'}).where({id: this.gameid}).catch((e) => {
            winston.log('warn', 'Unable to update game to completed', event.action, e)
        })
        
        
        //Transition to completed
        await this.recordStats(event.action.winner, event.action.loser)
        await this.transitionState('COMPLETED')
        this.broadcastStateChange('COMPLETED', 'The game has ended!')
        this.broadcastMessage('GAME:OVER', `Player ${player1Lost ? 2 : 1} won!`, { winner: event.action.winner, loser: event.action.loser})

        await this.persist()

        return true

    }

    async recordStats(winner, loser) {
        const rs = new RankService()
        const newRanks = rs.matchup(winner, loser).winner(1).newRanks()
        
        const winnerRank = newRanks.player1.rank
        const loserRank = newRanks.player2.rank
        
        try {
            await knex('user').update({ rank: winnerRank, wins: knex.raw('wins + 1')}).where({ id: winner.id})
            await knex('user').update({ rank: loserRank, losses: knex.raw('losses + 1')}).where({ id: loser.id})
        } catch (err) {
            winston.log('warn', 'Could not update stats', err)
        }

        return true

    }

    getOpponent(){
        const o = this.currentPlayer === 1 ? 2 : 1
        return o
    }

    getCurrentPlayerTargetBoard(){
        return this.players[this.getOpponent()].board
    }

    async guessLocation(playerNumber, location){
        if (this.isPlayerTurn(playerNumber) && this.isState('INPROGRESS')){
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
                        location
                    }
                }
        
                await knex('game_action').insert(event)
                .catch((e) => {
                    winston.log('warn', 'Unable to log player guess', event.action, e)
                })
                
                
                //Switch Turns if game isnt over
                const gameOver = await this.isGameOver()
                if (!gameOver)
                    this.nextPlayer()

                await this.persist()
            
            } catch (e) {
                winston.log('warn', 'Game Guess Error', { gameid: this.gameid, location }, e)
                this.messageToPlayer(playerNumber, 'GAME:GUESS:REJECT', e.message)
            }
        } else {
            this.messageToPlayer(playerNumber, 'GAME:GUESS:REJECT', 'Not your turn!')
        }
    }

    messageToPlayer(playerNumber, type = '', message = '', payload = {}){
        const socket = this.players[playerNumber].socket
        if (socket){
            socket.json({
                type,
                message,
                payload
            })
        }
        
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

    async addPlayerConnection(playerNumber, socket = {}, data = {}){
        if (!playerNumber > 0 || !socket.json || !data.id){
            winston.log('warn', 'addPlayerConnection called without proper parameters', playerNumber, socket, data)
        }
      
        let firstTimeJoin // false | true
        
        const existing = this.players[playerNumber]
        if (existing){
            firstTimeJoin = false
        } else {
            firstTimeJoin = true
        }
        
        const info = existing || {}
        let player = {
            socket,
            board: _.get(info, 'board', new GameBoard()),
            data: _.get(info, 'data', data)
        }

        this.players[playerNumber] = player
        this.broadcastMessage('GAME:PLAYER:JOIN', `Player ${playerNumber} joined`, _.get(player, 'data', data))
        
        const event = {
            gameid: this.gameid,
            datecreated: knex.fn.now(),
            action: {
                gameid: this.gameid,
                type: 'PLAYER_JOIN',
                player: _.get(player, 'data', data)
            }
        }

        await knex('game_action').insert(event)
        .catch((e) => {
            winston.log('warn', 'Unable to PLAYER_JOIN action', event.action, e)
        })

        await this.persist()

        // If the player is joining for the first time, we check to see if now both players are here
        if (firstTimeJoin){
            if (this.isPlayerHere(1) && this.isPlayerHere(2)){
                // If both players are here after someones first time joining, we can transition to SETUP
                await this.transitionState('SETUP')
                this.broadcastStateChange('SETUP', 'Setup your pieces!')
            } else {
                //If one player is missing, we still have to wait
                await this.transitionState('WAITING')
                this.broadcastStateChange('WAITING', 'Waiting for all players to join!')
            }
        } else {
            // If this is not the players first time joining, aka reconnecting, we just send them the current state
            // and other information
            
            const message = {
                state: this.currentState,
                self: {
                    board: this.players[playerNumber].board.view()
                },
                opponent: {
                    board: this.players[(playerNumber === 1 ? 2 : 1)].board.restrictedView()
                }
            }
            
            this.messageToPlayer(playerNumber, 'GAME:PLAYER:RECONNECT', '', message)
            this.setCurrentPlayer(this.currentPlayer)
        }


        
    }

}

module.exports = GameInstance