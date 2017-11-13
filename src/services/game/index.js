
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
import GameInstance from './GameInstance'
import { singleGameQueryWithPlayer } from '../../api/routes/games'
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
                        if (player.socket.id == socket.id){
                            player.socket = null
                            player = player.data
                        }
                    })
                        
                    game.broadcastMessage('GAME:PLAYER:LEAVE', 'User left', player)
                }

            })

            socket.on('message', async (data) => {
                const message = JSON.parse(data)
                const gameid = req.gameid
                // Authenticate User

                if (!message.token){
                    socket.json({type: 'ERROR', message: 'You must provide access token'})
                    socket.terminate()
                    return
                }

                const session = await retrieveUserFromSession(knex, message.token)

                if (!session){
                    socket.json({type: 'AUTH:REJECT', message: 'Invalid Auth token. Please reauthenticate'})
                    socket.terminate()
                    return
                }

                const player = buildUserObjectFromSession(session)
                
                const result = await knex.raw(singleGameQueryWithPlayer, [gameid, player.id, player.id])
                
                if (result.rows.length == 0){
                    socket.json({type: 'AUTH:REJECT', message: 'You are not part of this game!'})
                    socket.terminate()
                    return
                }
                
                const playerNumber = player.username === result.rows[0].player1.username ? 1 : 2
                
                // If the game isn't in memory, we need to fetch it
                if (!this.games.hasOwnProperty(gameid)){
                    this.games[gameid] = new GameInstance()
                }

                
                const game = this.games[gameid]
                
                //If the game is in memory but this is the first time the socket is joining
                if (!game.players[playerNumber].socket){
                    game.addPlayerConnection(playerNumber, socket, player)
                }

                // Process Command
                switch(message.type){
                    case 'GAME:PIECES:ATTEMPT':
                        game.setupPieces(playerNumber, message.payload)
                        break;
                    case 'GAME:GUESS:ATTEMPT':
                        break;
                }
                

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