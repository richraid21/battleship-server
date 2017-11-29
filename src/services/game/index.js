
/**
 * Game (Socket Server)
 * When the client connects to the socket server, they hit the url {base}/game/id
 * 
 * All socket messages are stringified JSON objects with the structure: 
 *  SocketMessage : {
 *      token: String,
 *      type: String {NOUN:[NOUN:]:VERB},
 *      message: String,
 *      payload: Object
 *  }
 */

import { retrieveUserFromSession, buildUserObjectFromSession } from '../../api/middleware/authentication'
import GameInstance from './gameInstance'
import { singleActiveGameQueryWithPlayer } from '../../api/routes/games'
const knex = require('../../services/data').default


 const VALID_CLIENT_MESSAGE_TYPES = [
    'AUTH:ATTEMPT',
    'GAME:PIECES:ATTEMPT',
    'GAME:GUESS:ATTEMPT'
 ]

 const VALID_SERVER_MESSAGE_TYPES = [
     'AUTH:ACCEPT',
     'AUTH:REJECT',
     'GAME:PLAYER:JOIN',
     'GAME:PLAYER:LEAVE',
     'GAME:PLAYER:TURN',
     'GAME:STATE',
     'GAME:PIECES:REJECT',
     'GAME:PIECES:ACCEPT',
     'GAME:GUESS:ACCEPT',
     'GAME:GUESS:REJECT',
     'GAME:OVER'
 ]

export class GameServer {
    
    constructor(server){
        this.clientNum = 0
        this.server = server
        
        this.games = {}


        this.server.on('connection', (socket, req) => {
            
            socket.json = function(data){
                this.send(JSON.stringify(data), (err) => {
                    if (err)
                        console.log('Failed to send message', err)
                })
            }

            socket.id = this.clientNum++
            
            socket.on('close', () => {
                const game = this.games[req.gameid]
                
                if (game){
                    let player = {}
                    
                    game.allPlayers().forEach((player) => {
                        if (player.socket && player.socket.id == socket.id){
                            player.socket = null
                            player = player.data
                        }
                    })

                    const event = {
                        gameid: req.gameid,
                        datecreated: knex.fn.now(),
                        action: {
                            gameid: req.gameid,
                            type: 'PLAYER_LEFT',
                            player: player
                        }
                    }
            
                    knex('game_action').insert(event).catch((e) => {
                        winston.log('warn', 'Unable to log action', event.action, e)
                    })
                        
                    game.broadcastMessage('GAME:PLAYER:LEAVE', 'User left', player)
                }

            })

            socket.on('message', async (data) => {
                const message = JSON.parse(data)
                
                if (!message.type || !VALID_CLIENT_MESSAGE_TYPES.includes(message.type)){
                    socket.json({type: 'MESSAGE:REJECT', message: 'Message must include a .type identifier'})
                    socket.terminate()
                    return
                }
                
                
                // Authenticate User

                if (!message.token){
                    socket.json({type: 'AUTH:REJECT', message: 'You must provide access token'})
                    socket.terminate()
                    return
                }

                const session = await retrieveUserFromSession(knex, message.token)

                if (!session){
                    socket.json({type: 'AUTH:REJECT', message: 'Invalid Auth token. Please reauthenticate'})
                    socket.terminate()
                    return
                }

                const gameid = req.gameid
                const player = buildUserObjectFromSession(session)
                
                const result = await knex.raw(singleActiveGameQueryWithPlayer, [gameid, player.id, player.id])
                
                if (result.rows.length == 0){
                    socket.json({type: 'AUTH:REJECT', message: 'You are not part of this game!'})
                    socket.terminate()
                    return
                }

                if (result.rows[0].status === 'COMPLETED'){
                    socket.json({type: 'AUTH:REJECT', message: 'This game is completed!'})
                    socket.terminate()
                    return
                }
                
                const playerNumber = player.username === result.rows[0].player1.username ? 1 : 2
                let game = this.games[gameid]

                // If the game isn't in memory, we need to fetch it
                if (!game){
                    const existing = await knex('game').first().where({ id: gameid})
                    const existingState = existing.state ? existing.state : { gameid }
                    game = new GameInstance(existingState)
                    this.games[gameid] = game
                }

                // If player is joining the socket...
                if (!game.isPlayerHere(playerNumber)){
                    game.addPlayerConnection(playerNumber, socket, player)
                }

                // Process Command
                switch(message.type){
                    case 'AUTH:ATTEMPT':
                        socket.json({type: 'AUTH:ACCEPT', message: 'Ok'});
                        return;
                    case 'GAME:PIECES:ATTEMPT':
                        game.setupPieces(playerNumber, message.payload)
                        break;
                    case 'GAME:GUESS:ATTEMPT':
                        game.guessLocation(playerNumber, message.payload)
                        break;
                }

                if (game.isState('COMPLETED')){
                    
                    game.allPlayers().forEach((player) => {
                        player.socket.terminate()
                    })

                    delete this.games[gameid]
                }

                // Persisting after every authenticated message should be fine?
                // TODO: think about persisting...
                await game.persist()
                return
            })
        })
    }
}


/**
 * When the client creates a connection to the socket server, they send 
 */
// AUTH:ATTEMPT -> AUTH:REJECT | (AUTH:ACCEPT & GAME:STATE)

// GAME:PIECES:ATTEMPT -> GAME:PIECES:REJECT | (GAME:PIECES:ACCEPT && GAME:STATE:CHANGE)

// GAME:TURN:ATTEMPT -> GAME:TURN:ACCEPT | GAME:TURN:REJECT | (GAME:OVER && GAME:STATE:CHANGE)