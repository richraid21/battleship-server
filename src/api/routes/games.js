import winston from 'winston'
import _ from 'lodash'

import { requiresAuth } from '../middleware/authentication'
import { malformedError, 
        forbiddenError, 
        genericError, 
        unauthorizedError,
        genericServerError } from '../utils/terminate'


const getGames = async (req, res) => {
    res.send(501, { message: 'Not Implemented'})
}

const createGame = async (req, res) => {
    res.send(501, { message: 'Not Implemented'})
}

const getGame = async (req, res) => {
    res.send(501, { message: 'Not Implemented'})
}

const removeGame = async (req, res) => {
    res.send(501, { message: 'Not Implemented'})
}



export const games = {
    get: requiresAuth(getGames),
    create: requiresAuth(createGame)
}

export const game = {
    get: requiresAuth(getGame),
    remove: requiresAuth(removeGame),
}

