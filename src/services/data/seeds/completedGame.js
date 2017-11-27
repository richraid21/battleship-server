
exports.seed = function(knex, Promise) {
  const expires = new Date()
  expires.setHours(expires.getHours() + 6)

  const dennis = {
    user: { id: 30000, nickname: 'dennis', datecreated: knex.fn.now(), hash: '$2a$10$mGtks2XKrOygARHCLP2l3e.GdU3tMjm982YflYJ8d8rcYF4TxE9g2' },
    session: { id: 30000, number: 'B34e1b90cc606e279d12a202d1ed3196140f5bf89b334cb106d3057c5f361f43', user: 30000, expires: expires, active: true, datecreated: knex.fn.now()},
    game: { id: 40000, datecreated: knex.fn.now(), name: 'Dennis beat Dee', status: 'COMPLETED', player1: 30000, player2: 40000 }
  }

  const dee = {
    user : { id: 40000, nickname: 'dee', datecreated: knex.fn.now(), hash: '$2a$10$mGtks2XKrOygARHCLP2l3e.GdU3tMjm982YflYJ8d8rcYF4TxE9g2'},
    session: { id: 40000, number: 'B34e1b90cc606e279d12a202d1ed3196140f5bf89b334cb106d3057c5f361f43', user: 40000, expires: expires, active: true, datecreated: knex.fn.now()}
  }

  const actions = require('../dataFiles/actions')

  return knex('user').insert([dennis.user, dee.user]).then(() => {
      knex('session').insert([dennis.session, dee.session]).then(() => {
        knex('game').insert([dennis.game]).then(() => {
          knex('game_action').insert(actions).then(() => {
          })
        })
      })
    }).catch((err) => {
      console.log(err)
    })
};
