
exports.up = function(knex, Promise) {

    return knex.schema.alterTable('game', (t) => {
      t.timestamp('expires')
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.table('game', (t) => {
        t.dropColumn('expires');
    })
};
