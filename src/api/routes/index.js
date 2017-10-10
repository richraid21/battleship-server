import auth from './auth'

// Constants & Setup
const baseRoute = '/api/'
let category = ''
let path = ''
const getPath = () => `${baseRoute}/${category}/${path}`

const routes = (app) => {

    // Auth Routes
    category = 'auth'

        path = 'register'
        app.post(getPath(), auth.register)

        path = 'login'
        app.post(getPath(), auth.login)

        path = 'refresh'
        app.post(getPath(), auth.refresh)

        path = 'logout'
        app.post(getPath(), auth.logout)

        path= 'me'
        app.get(getPath(), auth.me)
}

export default routes


