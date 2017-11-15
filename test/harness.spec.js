const knex = require('../src/services/data').default

const tables = [
    'user',
    'session',
    'game',
    'game_action',
    'game_result'
].reverse()

Promise.each = async function(arr, fn) {
  for(const item of arr) await fn(item);
}

const truncate = () => {
    return Promise.each(tables, (table) => {
      return knex.raw(`TRUNCATE TABLE "${table}" CASCADE;`);
    })
  }

describe('Integration Tests', function () {
    
      beforeAll(function () {
        return truncate()
      });
    
      afterAll(function () {
        return truncate();
      });
    
      require('./api/auth.test')
      require('./api/games.test')

      require('./services/ranking.test')
    
    });

