var env = process.env

var databaseConfig = {
    client: 'pg',
    connection: { 
        user: env.BS_DB_USER || 'postgres',
        password: env.BS_DB_PASSWORD || 'pixi3',
        host: env.BS_DB_HOST || '127.0.0.1',
        port: env.BS_DB_PORT || '5432',
        database: env.BS_DB_DATABASE || 'battleship' 
    },
    migrations: {
        directory: __dirname + '/services/data/migrations'
    },
    seeds: {
        directory: __dirname + './services/data/seeds'
    }
}

module.exports = databaseConfig