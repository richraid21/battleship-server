/*eslint-disable */

exports.up = function(knex, Promise) {
    
    return knex.schema
        
        .createTable('user', (t) => {
            t.increments('id')
            t.text('nickname')
            t.text('salt')
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
            t.integer('player1')
            t.integer('player2')
            t.text('name')
            t.timestamp('datecreated').defaultTo(knex.fn.now())
            
            t.foreign('player1').references('user.id')
            t.foreign('player2').references('user.id')
        })
};

exports.down = function(knex, Promise) {

    return knex.schema
        
        .table('session', (t) => {
            t.dropForeign('user')
        })
        .table('game', (t) => {
            t.dropForeign('player1')
            t.dropForeign('player2')
        })

        .dropTable('user')
        .dropTable('session')
        .dropTable('game')
        
    
};
