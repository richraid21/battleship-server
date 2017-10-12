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
};

exports.down = function(knex, Promise) {

    return knex.schema
        
        .table('session', (t) => {
            t.dropForeign('user')
        })
        .dropTable('user')
        .dropTable('session')
};
