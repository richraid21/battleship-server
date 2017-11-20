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

describe('End-to-End Tests', function () {
    
      beforeAll(function () {
        return truncate().then(() => knex.seed.run())
      });
      
      beforeAll( async (done) => {
        const standard_out = process.stdout
        
        process.stdout.write = jest.fn()
        const server =  require('../src/server')
          
          return setTimeout(() => {
            process.stdout = standard_out 
            done()
          }, 1000)
      });
    
      afterAll(function () {
        return truncate();
      });
    
      require('./e2e/game/base.test')
      
    });

