
import _ from 'lodash'
import winston from 'winston'

export const requiresAuth = (routeHandler) => (req, res) => {
    const token = req.header('Authorization', false)
    
    if (!token){
        res.send(401, { message: 'Not Authenticated'})
        winston.warn('Attempt to access Authorized resources without header')
        return
    }
        
    const key = token.split(' ')[1]
    if (!_.startsWith(token, 'Basic') || !key){
        res.send(400, { message: 'Malformed Authenicated Request'})
        return
    }

    if (_.isFunction(routeHandler))
        routeHandler(req, res)
}