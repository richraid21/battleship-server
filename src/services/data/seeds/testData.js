exports.seed = function(knex, Promise) {
    
      // Insert Users
      return knex('user').insert([
        {
          id: 1,
          nickname: 'rich',
          datecreated: knex.fn.now(),
          hash: '$2a$10$mGtks2XKrOygARHCLP2l3e.GdU3tMjm982YflYJ8d8rcYF4TxE9g2'
        },
        {
          id: 2,
          nickname: 'will',
          datecreated: knex.fn.now(),
          hash: '$2a$10$dAoeOM.SSJZy4pNbUPbRC.pirVLr5m4SdOfzQHbyedngaao.kptMG'
        }
      ]).then(() => {
        
        // Then insert sessions
        const expires = new Date()
        expires.setHours(expires.getHours() + 6)
        
        return knex('session').insert([
          {
            id: 1,
            number: 'f34e1b84cc606e279d12a202d1ed3196140f5bf89b334cb106d3057c5f361f43',
            user: 2,
            expires: expires,
            active: true,
            datecreated: knex.fn.now()
          },
          {
            id: 2,
            number: '3c1a20461b60b01981660be5693e66b9a164846d598560c518b0054063d0285a',
            user: 1,
            expires: expires,
            active: true,
            datecreated: knex.fn.now()
          }
        ]).then(() => {

          // Then insert games
          return knex('game').insert([
            {
              id: 1,
              datecreated: knex.fn.now(),
              name: 'Richs Game with Will',
              status: 'CREATING',
              player1: 1,
              player2: 2
            },
            {
              id: 2,
              datecreated: knex.fn.now(),
              name: 'Richs Open Game',
              status: 'CREATING',
              player1: 1,
            },
            {
              id: 3,
              datecreated: knex.fn.now(),
              name: 'Wills game with Rich',
              status: 'CREATING',
              player1: 2,
              player2: 1
            }
          ])
        })
      })

    }
    