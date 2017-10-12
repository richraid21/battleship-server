
exports.up = function(knex, Promise) {
  
    return knex.schema

        .createTable('game_status', (t) => {
            t.increments('id')
            t.integer('stage')
            t.text('name')
            t.text('description')
        })

        .createTable('game_piece', (t) => {
            t.increments('id')
            t.text('name')
            t.text('description')
            t.integer('length')
        })

        .createTable('player_action', (t) => {
            t.increments('id')
            t.text('name')
            t.text('description')
            t.specificType('stages', 'jsonb[]')
        })
    
        .createTable('game', (t) => {
            t.increments('id')
            t.text('name')
            t.integer('status')
            t.integer('player1')
            t.integer('player2')
            t.timestamp('datecreated').defaultTo(knex.fn.now())

            t.foreign('status').references('game_status.id')

            t.foreign('player1').references('user.id')
            t.foreign('player2').references('user.id')
        })
};

exports.down = function(knex, Promise) {
    
    return knex.schema
        
        .table('game', (t) => {
            t.dropForeign('status')
            t.dropForeign('player1')
            t.dropForeign('player2')
        })

        .dropTable('game')
        .dropTable('game_piece')
        .dropTable('player_action')
        .dropTable('game_status')
};
