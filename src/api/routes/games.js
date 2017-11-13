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
            gs.name as status,
            json_build_object('username', u1.nickname, 'rank', u1.rank) as player1,
            json_build_object('username', u2.nickname, 'rank', u2.rank) as player2
        FROM
            game g
        JOIN
            game_status gs ON g.status = gs.id
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
            status: 1,
            player1: req._user.id
        }
        const [game] = await req._knex('game').insert(data).returning('*')

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
        
        
            const result = await req._knex.raw(singleGameQuery, [gameId])
            const game = result.rows
    
            if (game.length == 0){
                return res.send(404)
            }
            
            if (req._user.id === game[0].player1.id){
                return forbiddenError(res, 'You cannot join your own game. You made it!')
            }

            const join = await req._knex('game').update('player2', req._user.id).where('id', gameId)
            
            res.send(200, join)
        
    } catch (err) {
        winston.log('warn', 'deleteGame() failed: ', err.message)
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
            
            res.send(200, deleteAction)
        
    } catch (err) {
        winston.log('warn', 'deleteGame() failed: ', err.message)
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

