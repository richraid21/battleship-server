import winston from 'winston'
import ws from 'ws'
import { initializeApplication } from './app'
import { GameServer } from './services/game'

// ws library doesn't allow wildcards when defining the PATH for connections
// We override the handler prototype to implement this logic
// If a valid url, we parse and attach the game id to the req object
// Match Pattern: /game/:id
ws.Server.prototype.shouldHandle = (req) => {
    const url = '^\/game\/[0-9]{1,9}$'
    const gameid = '[0-9]{1,9}$'
    
    const match = req.url.match(url)

    if (match){
        try {
            req.gameid = parseInt(req.url.match(gameid)[0])
        } catch (e) {
            winston.error(`Attempted socket connection with matching URL but unable to parse: ${req.url}`)
            return false
        }
    }
    return match
}

// Startup HTTP server and then attach websocket server
initializeApplication().then((server) => {

    const wss = new ws.Server({ server })
    const gameServer = new GameServer(wss)

    const app = server.listen(8080, function() {
        winston.info(`Running @ ${server.url}`)
    })

})

