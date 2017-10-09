
import restify from 'restify'
import io from 'socket.io'
import winston from 'winston'

import routes from './api/routes'

const logger = require('./services/logger')
logger.info('Logger Started')

const server = restify.createServer()
routes(server)

const socketEngine = io(server.server)
socketEngine.on('connection', () => {
  logger.silly('User connected')
})

server.listen(8080, function() {
  winston.info(`Server alive at ${server.url}`)
});

