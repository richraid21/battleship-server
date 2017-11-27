import request from 'supertest'
import { basicServer } from '../../src/app'
import _ from 'lodash'

describe('Game Routes', async () => {
    const app = basicServer()

    // User "Rich" from /seeds/testData
    const tokens = {
        rich: '3c1a20461b60b01981660be5693e66b9a164846d598560c518b0054063d0285a',
        will: 'f34e1b84cc606e279d12a202d1ed3196140f5bf89b334cb106d3057c5f361f43'
    }

    test('/games - It should return a list of games', async () => {
        const games = await request(app).get('/api/games').set('Authorization', `Basic ${tokens.rich}`)
        
        expect(games.status).toBe(200)
        expect(games.body.length).toBeGreaterThan(0)
        expect(_.find(games.body, {id: 10000}).name).toBe('Richs Game with Will')
    })

    test('/games - It should create a game', async () => {
        const body = {
            name: 'Test Game Creation'
        }

        const game = await request(app)
                            .post('/api/games')
                            .set('Authorization', `Basic ${tokens.rich}`)
                            .send(body)

        expect(game.status).toBe(200)
        expect(game.body.name).toBe('Test Game Creation')
    })

    test('/games/:id - It should delete the game', async () => {
        const games = await request(app).get('/api/games').set('Authorization', `Basic ${tokens.rich}`)
        const game = _.find(games.body, {name: 'Test Game Creation'})

        expect(game.player1.username).toBe('rich')

        const del = await request(app).del('/api/games/'+game.id).set('Authorization', `Basic ${tokens.rich}`)

        expect(del.status).toBe(200)
        expect(del.body.message).toBe('OK')
    })

    test('/games/:id - It should return a specific game', async () => {
        const game = await request(app).get('/api/games/10000').set('Authorization', `Basic ${tokens.rich}`)
    
        expect(game.body.length).toBe(1)
        expect(game.body[0].id).toBe(10000)
        expect(game.body[0].player1.username).toBe('rich')
    })

    test('/games/:id/join - It should reject allow player to join free game', async () => {
        const join = await request(app).post('/api/games/20000/join').set('Authorization', `Basic ${tokens.will}`)

        expect(join.status).toBe(200)
        expect(join.body.message).toBe('OK')

        const game = await request(app).get('/api/games/20000').set('Authorization', `Basic ${tokens.rich}`)

        expect(game.body[0].player2.username).toBe('will')
    })

    test('/games/:id/join - It should reject when game is full', async () => {
        const join = await request(app).post('/api/games/10000/join').set('Authorization', `Basic ${tokens.will}`)

        expect(join.status).toBe(403)
        expect(join.body.message).toBe('This game already has two players. Sorry!')

        const game = await request(app).get('/api/games/10000').set('Authorization', `Basic ${tokens.rich}`)

        expect(game.body[0].player2.username).toBe('will')
    })

    test('/games/:id/join - It shouldnt let a player join their own game', async () => {
        
        const join = await request(app).post('/api/games/20000/join').set('Authorization', `Basic ${tokens.rich}`)

        expect(join.status).toBe(403)

    })

    test('/games/:id/history - It should not show in-progress game', async () => {
        const history = await request(app).get('/api/games/20000/history').set('Authorization', `Basic ${tokens.rich}`)
        expect(history.status).toBe(403)
    })

    test('/games/:id/history - It should only show history for COMPLETED games', async () => {
        expect.assertions(57) // 11 history items * 4 property assertions + status
        const history = await request(app).get('/api/games/40000/history').set('Authorization', `Basic ${tokens.rich}`)
        
        expect(history.status).toBe(200)

        history.body.forEach(el => {
            expect(el.action).toHaveProperty('type')
            expect(el.action).toHaveProperty('gameid')
            expect(el).toHaveProperty('gameid')
            expect(el).toHaveProperty('datecreated')
        })
        
    })
})