import { requiresAuth } from '../controllers/authentication'

const register = (req, res) => {
    res.send(501, {message: 'Not Implemented'})
}

const login = (req, res) => {
    res.send(501, {message: 'Not Implemented'})
}

const refresh = (req, res) => {
    res.send(501, {message: 'Not Implemented'})
}

const logout = (req, res) => {
    res.send(501, {message: 'Not Implemented'})
}

const routes = {
    register: register,
    login: login, 
    refresh: requiresAuth(refresh),
    logout: requiresAuth(logout)
}

export default routes