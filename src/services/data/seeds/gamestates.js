
exports.seed = function(knex, Promise) {

  return knex('game_status').count('id')
    .then(function (res) {
      if (Number(res[0].count) == 0){
        
        return knex('game_status').insert([
          { id: 1, name: 'CREATING', description: 'Creating', stage: 1 },
          { id: 2, name: 'WAITING', description: 'Waiting', stage: 2 },
          { id: 3, name: 'SETUP', description: 'Setting Up', stage: 3 },
          { id: 4, name: 'INPROGRESS', description: 'In-Progress', stage: 4 },
          { id: 5, name: 'COMPLETED', description: 'Completed', stage: 5 }
        ])
      }

      return Promise.resolve()
    })

}
