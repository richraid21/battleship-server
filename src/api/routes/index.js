import auth from './auth'

//Constants & Setup
const baseRoute = '/api/'
let path, category
const getPath = () => `${baseRoute}/${category}/${path}`

const routes = (app) => {

    // Auth Routes
    category = 'auth'

        path = 'register'
        app.post(getPath(), auth.register)

        path = 'login'
        app.post(getPath(), auth.login)

        path = 'refresh'
        app.get(getPath(), auth.refresh)

        path = 'logout'
        app.post(getPath(), auth.logout)
}

export default routes


