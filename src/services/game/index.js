
/**
 * Game (Socket Server)
 * When the client connects to the socket server, they hit the url {base}/game/id
 * 
 * All socket messages are stringified JSON objects with the structure: 
 *  SocketMessage : {
 *      type: String {NOUN:[NOUN:]:VERB},
 *      message: String,
 *      payload: Object
 *  }
 */

const GameInstance = require('./gameInstance')
const GameEventService = require('./gameEventService')


 const VALID_CLIENT_MESSAGE_TYPES = [
    'AUTH:ATTEMPT',
    'GAME:PIECES:ATTEMPT',
    'GAME:GUESS:ATTEMPT',
    'GAME:FORFEIT:ATTEMPT'
 ]

 const VALID_SERVER_MESSAGE_TYPES = [
     'AUTH:ACCEPT',
     'GAME:PLAYER:JOIN',
     'GAME:PLAYER:LEAVE',
     'GAME:STATE',
     'GAME:PIECES:REJECT',
     'GAME:PIECES:ACCEPT',
     'GAME:GUESS:ACCEPT',
     'GAME:GUESS:REJECT',
     'GAME:OVER'
 ]

 
class SocketMessage {
    constructor(){
        this.type = ''
        this.message = ''
        this.payload = {}
    }
}

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
                
                if (game.player1.id == socket.id){
                    delete game.player1
                } else {
                    delete game.player2
                }
                    
                this.message(game, 'GAME:PLAYER:LEAVE', 'Player left', socket.player)
            })

            socket.on('message', (data) => {
                
                // Authenticate User
                socket.player = {
                    username: 'Rich',
                    rank: 1200
                }
                // Ensure the access key provided is linked to a player in the game with the id
                // Determine whether the incoming player is player 1 or 2
                const playerNumber = data

                // Retrieve game from database if not in memory
                const gameid = req.gameid
                if (!this.games.hasOwnProperty(gameid)){
                    this.games[gameid] = {
                        instance: new GameInstance(new GameEventService()),
                    }
                }

                //Assign the socket into the game
                this.games[gameid][`player${playerNumber}`] = socket
                const game = this.games[gameid]
                
                //Broadcast a player has joined
                this.message(game, 'GAME:PLAYER:JOIN', `Player ${playerNumber} joined`, socket.player)
                
                //If both players are now present, transition the game state
                
                if (game.player1 && game.player2){
                    
                    this.state(game, 'SETUP', 'Setup your pieces...')
                
                } else {
                    
                    this.state(game, 'WAITING', 'Waiting for all players to join')

                }



                // Process Command
                
                const message = JSON.stringify(data)

            })
        })
    }

    state(game, state, message = ''){
        this.broadcast(game, {
            type: 'GAME:STATE',
            message,
            payload: {
                state
            }
        })
    }

    message(game, type, message, payload = {}){
        this.broadcast(game, {
            type: type,
            message,
            payload: payload
        })
    }

    broadcast(game, data){
        if (game.player1)
            game.player1.json(data)
        
        if (game.player2)
            game.player2.json(data)
    }

    placePieces(message) {
        console.log(message)
    }

    gameGuess(message) {

    }

    gameForfeit(message) {

    }


}


/**
 * When the client creates a connection to the socket server, they send 
 */
// AUTH:ATTEMPT -> AUTH:REJECT | (AUTH:ACCEPT & GAME:STATE)

// GAME:PIECES:ATTEMPT -> GAME:PIECES:REJECT | (GAME:PIECES:ACCEPT && GAME:STATE:CHANGE)

// GAME:TURN:ATTEMPT -> GAME:TURN:ACCEPT | GAME:TURN:REJECT | (GAME:OVER && GAME:STATE:CHANGE)