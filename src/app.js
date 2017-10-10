
import restify from 'restify'
import io from 'socket.io'
import winston from 'winston'

import { migrateToLatest } from './services/data'
import routes from './api/routes'

const logger = require('./services/logger')
const knex = require('./services/data')

export const initializeApplication = async () => {
  winston.info('Application Starting...')

  await migrateToLatest()

  const server = restify.createServer()
  server.use(restify.plugins.bodyParser())
  server.use((req, res, next) => {
    req._knex = knex.default
    return next()
  })
  routes(server)

  const socketEngine = io(server.server)
  socketEngine.on('connection', () => {
    winston.silly('User connected')
  })

  return server
}

export const basicServer = () => {
  const server = restify.createServer()

  server.use(restify.plugins.bodyParser())
  server.use((req, res, next) => {
    req._knex = knex.default
    return next()
  })
  routes(server)
  
  return server
}








