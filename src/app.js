
import restify from 'restify'
import winston from 'winston'

import { migrateToLatest } from './services/data'
import routes from './api/routes'

// Statically require these two at runtime so the objects get cached
const logger = require('./services/logger')
const knex = require('./services/data')

// Expose the application creator which will automatically
// migrate the database and return the Restify instance
export const initializeApplication = async () => {
  winston.info('Application Starting...')

  await migrateToLatest()

  const server = restify.createServer()
  server.use(restify.plugins.bodyParser())

  if (process.env.NODE_ENV='dev'){
    winston.warn('dev-mode detected. Enables CORS(*). Disable in production')
    const corsMiddleware = require('restify-cors-middleware')
    
    const cors = corsMiddleware({
      origins: ['*'],
      allowHeaders: ['*'],
      exposeHeaders: ['*']
    })
    
    server.pre(cors.preflight)
    server.use(cors.actual)
  }


  server.use((req, res, next) => {
    req._knex = knex.default
    return next()
  })
  
  routes(server)

  return server
}

// Returns the Restify instance in sync for faster unit testing
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








