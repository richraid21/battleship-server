
import restify from 'restify'
import io from 'socket.io'
import winston from 'winston'

import routes from './api/routes'

const logger = require('./services/logger')


const server = restify.createServer()
routes(server)

const socketEngine = io(server.server)

server.listen(8080, function() {
  winston.info(`Server alive at ${server.url}`)
});

