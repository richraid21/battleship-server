
const WebSocket = require('ws')
const _ = require('lodash')
const knex = require('../../../src/services/data').default

const serverUrl = 'ws://localhost:8080/game/10000'

const players = {
    
    1: {
        username: 'rich',
        token: '3c1a20461b60b01981660be5693e66b9a164846d598560c518b0054063d0285a',
        pieces: '',
        socket: null,
        connect: null,
        message: null
    },
    
    2: {
        username: 'will',
        token: 'f34e1b84cc606e279d12a202d1ed3196140f5bf89b334cb106d3057c5f361f43',
        pieces: '',
        socket: null,
        connect: null,
        message: null
    }


}

const player = (num, key) => players[num][key]


describe('Game - Base Choice Path', () => {

    it('Should open connection with player 1', done => {
        expect.assertions(1)

        players[1].socket = new WebSocket(serverUrl)
        
        players[1].socket.on('open', function(){
            expect(this.arguments).toBe(undefined)
            done()
        })
    })

    it('Should open connection with player 2', done => {
        expect.assertions(1)
        
        players[2].socket = new WebSocket(serverUrl)
        
        players[2].socket.on('open', function(){
            expect(this.arguments).toBe(undefined)
            done()
        })
    })

    it('Should accept player1 and respond with messages', done => {
        expect.assertions(4)

        let calls = []
        player(1, 'socket').on('message', (message) => {
            const data = JSON.parse(message)
            calls.push(data)

            if (calls.length === 3){
                const playerJoin = _.find(calls, { type: 'GAME:PLAYER:JOIN' })
                const authAccept = _.find(calls, { type: 'AUTH:ACCEPT' })
                const gameState = _.find(calls, { type: 'GAME:STATE' })

                expect(playerJoin).toBeTruthy()
                expect(playerJoin.payload.username).toBe(player(1, 'username'))
                
                expect(authAccept).toBeTruthy()

                expect(gameState).toBeTruthy()

                done()
            }
        })

        player(1, 'socket').send(JSON.stringify({ type: 'AUTH:ATTEMPT', token: player(1, 'token')}))

    })

    it('Should accept player2, broadcast messages to both players and transition state', done => {
        
        // Keep track of socket messages on a per player basis
        let messageStacks = { 1: [], 2: [] }
        
        // Messages to player 1 just get put into the stack
        player(1, 'socket').on('message', (message) => {
            const data = JSON.parse(message)
            messageStacks[1].push(data)
        })

        // Messages to player 2 get put into the stack, but since player 2
        // will get more messages, we do the actual assertions inside here
        player(2, 'socket').on('message', async (message) => {
            expect.assertions(10)
            
            const data = JSON.parse(message)
            messageStacks[2].push(data)

            if (messageStacks[2].length >= 3){
                
                expect(messageStacks[1].length).toBe(2)
                expect(messageStacks[2].length).toBe(3)

                const player1_notified = _.find(messageStacks[1], { type: 'GAME:PLAYER:JOIN' })
                expect(player1_notified).toBeTruthy()
                expect(player1_notified.payload.username).toBe(player(2, 'username'))

                const player1_gameState = _.find(messageStacks[1], { type: 'GAME:STATE', message: 'Setup your pieces!'})
                expect(player1_gameState).toBeTruthy()

                const player2_join = _.find(messageStacks[2], { type: 'GAME:PLAYER:JOIN' })
                expect(player2_join).toBeTruthy()
                expect(player2_join.payload.username).toBe(player(2, 'username'))

                
                const player2_auth = _.find(messageStacks[2], { type: 'AUTH:ACCEPT' })
                expect(player2_auth).toBeTruthy()
                
                const player2_gameState = _.find(messageStacks[2], { type: 'GAME:STATE' })
                expect(player2_gameState).toBeTruthy()

                const game = await knex('game').first().where({ id: 10000 })
                expect(game.state.currentState).toBe('SETUP')

                done()
            }
        })

        player(2, 'socket').send(JSON.stringify({ type: 'AUTH:ATTEMPT', token: player(2, 'token')}))

    })
    
})