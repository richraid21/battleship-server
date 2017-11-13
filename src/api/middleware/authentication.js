
import _ from 'lodash'
import winston from 'winston'

export const retrieveUserFromSession = async (knex, token) => {
    console.log(token)
    try {
        const session = await knex('session')
                                .first()
                                .innerJoin('user', 'user.id', 'session.user')
                                .where('expires', '>', knex.fn.now())
                                .andWhere('number', token)
                                .andWhere('active', true)
                                .orderBy('expires', 'desc')

        return session

    } catch (err) {
        winston.warn('Could not validate user session', err)
        return false
    }
    
}

export const buildUserObjectFromSession = (session) => {
    return {
        id: session.id,
        username: session.nickname,
        datecreated: session.datecreated
    }
}

export const requiresAuth = (routeHandler) => async (req, res) => {

    const bearer = req.header('Authorization', false)
    
    if (!bearer) {
        res.send(401, { message: 'Not Authenticated' })
        winston.warn('Attempt to access Authorized resources without header')
        
        return
    }
        
    const [, token] = bearer.split(' ')
    if (!_.startsWith(bearer, 'Basic') || !token) {
        res.send(400, { message: 'Malformed Authenicated Request' })
        
        return
    }

    const session = await retrieveUserFromSession(req._knex, token)
    
    if (session){
        req._user = buildUserObjectFromSession(session)
    } else {
        res.send(401, { message: 'Invalid Session'})
        
        return
    }


    if (_.isFunction(routeHandler)) {
        routeHandler(req, res)
    }     
}
