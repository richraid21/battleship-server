import winston from 'winston'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

import { requiresAuth } from '../middleware/authentication'
import { malformedError, forbiddenError, genericError } from '../utils/terminate'

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

const register = async (req, res) => {
    winston.debug('Registering')
    
    const nickname = req.body.username
    const password = req.body.password

    if (!nickname || !password) {
        
        return malformedError(res, 'Please provide a username and password to register')
    }

    const isExistingUser = await req._knex('user').first('id').where({ nickname })
    if (!isExistingUser){

            try{
                const hash = await bcrypt.hash(password, bcryptSaltRounds)
                const [user] = await req._knex('user').insert({ nickname, hash}).returning('*')
                
                const token = await _generateSessionToken()
                const _token = Object.assign({}, token, { user: user.id })
                const [session] = await req._knex('session').insert(_token).returning('*')

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

const login = (req, res) => {
    res.send(501, { message: 'Not Implemented' })
}

const refresh = (req, res) => {
    res.send(501, { message: 'Not Implemented' })
}

const logout = (req, res) => {
    res.send(501, { message: 'Not Implemented' })
}

const routes = {
    register,
    login, 
    refresh: requiresAuth(refresh),
    logout: requiresAuth(logout)
}

export default routes
