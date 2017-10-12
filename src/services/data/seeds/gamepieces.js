
exports.seed = function(knex, Promise) {
    
      return knex('game_piece').count('id')
        .then(function (res) {
          if (Number(res[0].count) == 0){
            
            return knex('game_piece').insert([
              { name: 'CARRIER', description: 'Aircraft Carrier', length: 5 },
              { name: 'BATTLESHIP', description: 'Battleship', length: 4 },
              { name: 'CRUISER', description: 'Cruiser', length: 3 },
              { name: 'SUBMARINE', description: 'Submarine', length: 3 },
              { name: 'DESTROYER', description: 'Destroyer', length: 2 }
            ])
          }
    
          return Promise.resolve()
        })
    
    }
    