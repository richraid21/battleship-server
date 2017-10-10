
import winston from 'winston'
import dbConfig from '../../knexfile'

const knex = require('knex')(dbConfig)

export const migrateToLatest = async () => {

    try {
        const migration = await knex.migrate.latest()
        const version = await knex.migrate.currentVersion()
        winston.info(`Database Schema: #${version}`)
    } catch (err) {
        winston.log('error', 'Unable to migrate to latest database schema', err)
        process.exit(-1)
    } 
}

export default knex