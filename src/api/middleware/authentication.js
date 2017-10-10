
import _ from 'lodash'
import winston from 'winston'

const _retrieveUserFromSession = async (knex, token) => {
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
        winston.warn('Could not validate user session')
        return false
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

    const session = await _retrieveUserFromSession(req._knex, token)
    
    if (session){
        req._user = {
            id: session.id,
            username: session.nickname,
            datecreated: session.datecreated
        }
    } else {
        res.send(401, { message: 'Invalid Session'})
        
        return
    }


    if (_.isFunction(routeHandler)) {
        routeHandler(req, res)
    }     
}
