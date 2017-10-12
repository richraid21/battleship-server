exports.seed = function(knex, Promise) {
    
      return knex('player_action').count('id')
        .then(function (res) {
          if (Number(res[0].count) == 0){
            
            return knex('player_action').insert([
              { name: 'SHUTDOWN_GAME', description: 'Close Game', stages: [1,2] },
              { name: 'CONCEDE_GAME', description: 'Concede Game', stages: [3,4,5] },
              { name: 'PLACE_SHIP', description: 'Place Ship', stages: [3] },
              { name: 'GUESS', description: 'Make a guess', stages: [4] }
            ])
          }
    
          return Promise.resolve()
        })
    
    }
    