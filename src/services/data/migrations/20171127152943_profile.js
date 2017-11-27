
exports.up = function(knex, Promise) {
    return knex.schema
        .alterTable('user', (t) => {
            t.integer('wins').notNullable().defaultTo(0)
            t.integer('losses').notNullable().defaultTo(0)
        })
};

exports.down = function(knex, Promise) {
    return knex.schema
        .alterTable('user', (t) => {
            t.dropColumns('wins', 'losses')
        })
};
