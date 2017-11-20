import winston from 'winston'
import _ from 'lodash'

import { requiresAuth } from '../middleware/authentication'
import { malformedError, 
        forbiddenError, 
        genericError, 
        unauthorizedError,
        genericServerError } from '../utils/terminate'

export const gameQuery = `
        SELECT
            g.id,
            g.name,
            g.datecreated,
            g.status,
            json_build_object('username', u1.nickname, 'rank', u1.rank) as player1,
            json_build_object('username', u2.nickname, 'rank', u2.rank) as player2
        FROM
            game g
        JOIN
            "user" u1 ON g.player1 = u1.id
        LEFT OUTER JOIN
            "user" u2 ON g.player2 = u2.id
    `

export const singleGameQuery = gameQuery + `
        WHERE
            g.id = ?
`

export const singleGameQueryWithPlayer = singleGameQuery + `
        AND (g.player1 = ? OR g.player2 = ?)
`

const getGames = async (req, res) => {
    try {

        const result = await req._knex.raw(gameQuery)
        const games = result.rows
        res.send(200, games)

    } catch (err) {
        winston.log('warn', 'getGames() failed: ', err.message)
        genericServerError(res)
    }
}

const createGame = async (req, res) => {
    const body = req.body
    const { name } = body
    if (!name)
        return malformedError(res, 'You must provide a name to create a game')
    
    try {
        const data = {
            name,
            status: 'CREATING',
            player1: req._user.id
        }

        const [game] = await req._knex('game').insert(data).returning('*')
        
        game.player1 = {
            username: req._user.username
        }

        res.send(200, game)
    } catch (err) {
        winston.log('warn', 'createGame() failed: ', err.message)
        genericServerError(res)
    }

}

const getGame = async (req, res) => {
    try {
        const gameId = req.params.id
        if (!parseInt(gameId))
            return malformedError(res, 'Requires a valid integer')
        
        
        const result = await req._knex.raw(singleGameQuery, [gameId])
        const game = result.rows

        if (game.length == 0){
            res.send(404)
            return
        }

        const stateHistory = await req._knex('game_action').select().where({ gameid: game[0].id}).orderBy('datecreated')
        if (stateHistory)
            game[0].history = stateHistory

        res.send(200, game)
        
    } catch (err) {
        winston.log('warn', 'getGame() failed: ', err.message)
        genericServerError(res)
    }
}

const joinGame = async (req, res) => {
    
    try {
        const gameId = req.params.id
        if (!parseInt(gameId))
            return malformedError(res, 'Requires a valid integer')
        
        
            const game = await req._knex('game').first().where({id: gameId})
            console.log(game.player2)
            if (!game){
                return res.send(404)
            }
            
            // player1 the field is the user id foreign key
            // player1 when returned via the custom query is the player object
            if (req._user.id === game.player1){
                return forbiddenError(res, 'You cannot join your own game. You made it!')
            }

            
            if (game.player2 !== null){
                return forbiddenError(res, 'This game already has two players. Sorry!')
            }

            const join = await req._knex('game').update('player2', req._user.id).where('id', gameId)
            
            if (join == 1){
                return res.send(200, { message: 'OK'})
            } else {
                return genericServerError(res)
            }
            
        
    } catch (err) {
        winston.log('warn', 'joinGame() failed: ', err)
        genericServerError(res)
    }
}

const removeGame = async (req, res) => {
    try {
        const gameId = req.params.id
        if (!parseInt(gameId))
            return malformedError(res, 'Requires a valid integer')
        
        
            const result = await req._knex.raw(singleGameQuery, [gameId])
            const game = result.rows
    
            if (game.length == 0){
                return res.send(404)
            }

            if (req._user.username !== game[0].player1.username){
                return unauthorizedError(res, 'You are not allowed to delete this game')
            }

            const deleteAction = await req._knex('game').del().where('id', gameId)
            
            res.send(200, { message: 'OK'})
        
    } catch (err) {
        winston.log('warn', 'deleteGame() failed: ', err)
        genericServerError(res)
    }
}



export const games = {
    get: requiresAuth(getGames),
    create: requiresAuth(createGame)
}

export const game = {
    get: requiresAuth(getGame),
    join: requiresAuth(joinGame),
    remove: requiresAuth(removeGame),
}

