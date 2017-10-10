
import winston from 'winston'
import dbConfig from '../../knexfile'

const knex = require('knex')(dbConfig)

export const migrateToLatest = async () => {
    const migration = await knex.migrate.latest()
    const version = await knex.migrate.currentVersion()
    winston.info(`Current Database Schema: #${version}`)
}

export default knex