const args = process.argv

describe('Full Test Suite', () => {

    require('./unit.spec')
    require('./e2e.spec')
    
})