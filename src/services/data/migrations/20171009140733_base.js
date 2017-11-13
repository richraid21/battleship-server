/*eslint-disable */

exports.up = function(knex, Promise) {
    
    return knex.schema
        
        .createTable('user', (t) => {
            t.increments('id')
            t.timestamp('datecreated').defaultTo(knex.fn.now())
            
            t.text('nickname')
            t.integer('rank').defaultTo(1200)
            t.text('hash')
        })

        .createTable('session', (t) => {
            t.increments('id')
            t.timestamp('datecreated').defaultTo(knex.fn.now())
            t.integer('user')
            
            t.text('number')
            t.datetime('expires')
            t.boolean('active').defaultTo(1)
            
            t.foreign('user').references('user.id')
        })

        .createTable('game', (t) => {
            t.increments('id')
            t.timestamp('datecreated').defaultTo(knex.fn.now())
            
            t.text('name')
            t.text('status')
            t.integer('player1').notNullable()
            t.integer('player2')
            t.jsonb('state')

            t.foreign('player1').references('user.id')
            t.foreign('player2').references('user.id')
        })

        .createTable('game_action', (t) => {
            t.increments('id')
            t.timestamp('datecreated').defaultTo(knex.fn.now())
            
            t.integer('gameid').notNullable()
            t.jsonb('action')

            t.foreign('gameid').references('game.id')
        })

        .createTable('game_result', (t) => {
            t.increments('id')
            t.timestamp('datecreated').defaultTo(knex.fn.now())
            
            t.integer('gameid').notNullable()
            t.integer('winner').notNullable()
            t.integer('loser').notNullable()
            
            t.foreign('gameid').references('game.id')
            t.foreign('winner').references('user.id')
            t.foreign('loser').references('user.id')
        })
};

exports.down = function(knex, Promise) {

    return knex.schema
        
        .table('game_result', (t) => {
            t.dropForeign('gameid')
            t.dropForeign('winner')
            t.dropForeign('loser')
        })
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
        .dropTable('game_result')
        .dropTable('game_action')
        .dropTable('game')
        
};
