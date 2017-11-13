/*eslint-disable */

exports.up = function(knex, Promise) {
    
    return knex.schema
        
        .createTable('user', (t) => {
            t.increments('id')
            t.text('nickname')
            t.integer('rank').defaultTo(1200)
            t.text('hash')
            t.timestamp('datecreated').defaultTo(knex.fn.now())
        })

        .createTable('session', (t) => {
            t.increments('id')
            t.text('number')
            t.integer('user')
            t.datetime('expires')
            t.boolean('active').defaultTo(1)
            t.timestamp('datecreated').defaultTo(knex.fn.now())

            t.foreign('user').references('user.id')
        })

        .createTable('game', (t) => {
            t.increments('id')
            t.text('name')
            t.text('status')
            t.integer('player1').notNullable()
            t.integer('player2')
            t.timestamp('datecreated').defaultTo(knex.fn.now())

            t.jsonb('state')

            t.foreign('player1').references('user.id')
            t.foreign('player2').references('user.id')
        })

        .createTable('game_action', (t) => {
            t.increments('id')
            t.integer('gameid').notNullable()
            t.timestamp('datecreated').defaultTo(knex.fn.now())
            t.jsonb('action')

            t.foreign('gameid').references('game.id')
        })
};

exports.down = function(knex, Promise) {

    return knex.schema
        .table('game_action', (t) => {
            t.dropForeign('gameid')
        })
        .table('game', (t) => {
            t.dropForeign('player1')
            t.dropForeign('player2')
        })
        .table('session', (t) => {
            t.dropForeign('user')
        })
        .dropTable('user')
        .dropTable('session')
        .dropTable('game_action')
        .dropTable('game')
        
};
