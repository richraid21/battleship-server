
exports.seed = function(knex, Promise) {

  return knex('game_status').count('id')
    .then(function (res) {
      if (Number(res[0].count) == 0){
        
        return knex('game_status').insert([
          { name: 'CREATING', description: 'Creating', stage: 1 },
          { name: 'WAITING', description: 'Waiting', stage: 2 },
          { name: 'SETUP', description: 'Setting Up', stage: 3 },
          { name: 'INPROGRESS', description: 'In-Progress', stage: 4 },
          { name: 'COMPLETED', description: 'Completed', stage: 5 }
        ])
      }

      return Promise.resolve()
    })

}
