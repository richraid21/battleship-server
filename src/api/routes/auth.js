import winston from 'winston'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import _ from 'lodash'

import { requiresAuth } from '../middleware/authentication'
import { malformedError, 
        forbiddenError, 
        genericError, 
        unauthorizedError,
        genericServerError } from '../utils/terminate'

const bcryptSaltRounds = 10

const _generateSessionToken = async () => {
    const sessionBuffer = await crypto.randomBytes(32)
    const expires = new Date()

    expires.setHours(expires.getHours() + 6)
    const _session = {
        number: sessionBuffer.toString('hex'),
        expires: expires.toISOString()
    }

    return _session
}

const _persistSessionToken = async (knex, token = {}) => {
    const { number, expires, user } = token

    if (!number || !expires || !user){
        winston.log('warn', 'Attempt to persist session token without required information: ', token)
        throw new Error('Persisting session tokens requires number/expires/user')
    }
    
    const [session] = await knex('session').insert(token).returning('*')
    const expired = await knex('session').update('active', 0).where('user', user).whereNot('id', session.id)

    return session
    
}

const _validateUserCredentials = async (knex, credentials = {}) => {
    const { nickname, password } = credentials
    const user = await knex('user').first().where({ nickname })
    
    if (user && _.has(user, 'hash')) {
        const isMatchingPassword = await bcrypt.compare(password, user.hash)
        
        if (isMatchingPassword) {
            const _user = {
                id: user.id,
                nickname: user.nickname,
                datecreated: user.datecreated
            }
            
            return _user
        }
    }

    return false
}

const _invalidateUserSession = async (knex, userid) => {
    const updatedCount = await knex('session').update('active', 0).where('user', userid)
    
        if (updatedCount >= 0)
            return true
        
        return false
}

const register = async (req, res) => {
    const body = req.body || {}
    const nickname = body.username
    const password = body.password

    if (!nickname || !password) {
        
        return malformedError(res, 'Please provide a username and password to register')
    }

    const isExistingUser = await req._knex('user').first('id').where({ nickname })
    if (!isExistingUser){

            try{
                const hash = await bcrypt.hash(password, bcryptSaltRounds)
                const [user] = await req._knex('user').insert({ nickname, hash}).returning('*')
                
                const token = await _generateSessionToken()
                const _token = _.assign({}, token, { user: user.id })
                const session = await _persistSessionToken(req._knex, _token)

                return res.send(200, { 
                    username: user.nickname, 
                    datecreated: user.datecreated,
                    auth: {
                        token: session.number,
                        expires: session.expires
                    }
                })

            } catch (err) {
                winston.error(err)
                
                return genericError(res, 'Could not complete your request')
            }

    } else {
        
        return forbiddenError(res, 'User with that username already exists')
    }
}

const login = async (req, res) => {
    const body = req.body || {}
    const nickname = body.username
    const password = body.password

    if (!nickname || !password) {
        
        return malformedError(res, 'Please provide a username and password to login')
    }

    try {
        const user = await _validateUserCredentials(req._knex, { nickname, password })
        
        if (user) {
            const token = await _generateSessionToken()
            const _token = _.assign({}, token, { user: user.id })
            const session = await _persistSessionToken(req._knex, _token)
        
            return res.send(200, { 
                username: user.nickname, 
                datecreated: user.datecreated,
                auth: {
                    token: session.number,
                    expires: session.expires
                }
            })
        }
    } catch (err) {
        winston.log('error', 'Login Attempt Failed with generic error', err)
        return genericError(res)
    }
    

    return unauthorizedError(res, 'No account found with the provided credentials')
}

const refresh = async (req, res) => {
    try {
        const user = req._user || {}
        const userid = user.id
        
        const token = await _generateSessionToken()
        const _token = _.assign({}, token, { user: userid })
        const session = await _persistSessionToken(req._knex, _token)

        return res.send(200, { 
            username: user.username, 
            datecreated: user.datecreated,
            auth: {
                token: session.number,
                expires: session.expires
            }
        })

    } catch (err) {
        winston.log('error', 'Failed to refresh user token', err)
        return genericError(res)
    }
}

const me = (req, res) => {
    const user = {
        username: req._user.username,
        datecreated: req._user.datecreated
    }
    res.send(200, user)
}

const logout = async (req, res) => {

    try {
        const successfulInvalidation = await _invalidateUserSession(req._knex, req._user.id)

        if (successfulInvalidation) {
            return res.send(200)
        } else {
            winton.error('Could not invalidate users sessions')
            return genericError(res)
        }
    } catch (err) {
        winston.log('error', 'Server error invalidation session: ', err)
        return genericError(res)
    }

}

const routes = {
    register,
    login, 
    refresh: requiresAuth(refresh),
    logout: requiresAuth(logout),
    me: requiresAuth(me)
}

export default routes
