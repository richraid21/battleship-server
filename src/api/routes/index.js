import auth from './auth'
import { game, games } from './games'

// Constants & Setup
const baseRoute = '/api/'
let category = ''
let path = ''
const getPath = () => `${baseRoute}/${category}/${path}`

const routes = (app) => {

    // Auth Routes
    category = 'auth'

        /**
         * @api {post} /auth/register Register
         * @apiVersion 1.0.0
         * @apiName registerUser
         * @apiGroup User
         * 
         * @apiParam {String}   username The user's desired username in the system.
         * @apiParam {String}   password The user's password.
         * 
         * @apiSuccess {String} username Username of the user.
         * @apiSuccess {Date}   datecreated Account creation date.
         * @apiSuccess {Object} auth Session information.
         * @apiSuccess {String} auth.token Session token used for future API requests.
         * @apiSuccess {Date}   auth.expires Session expiration.
         * 
         * @apiError {String}   message The reason for the failure.
         * 
         */
        path = 'register'
        app.post(getPath(), auth.register)

        /**
         * @api {post} /auth/login Login
         * @apiDescription      Create a session with the specified credentials
         * @apiVersion 1.0.0
         * @apiName loginUser
         * @apiGroup User
         * 
         * @apiParam {String}   username
         * @apiParam {String}   password
         * 
         * @apiSuccess {String} username Username of the user.
         * @apiSuccess {Date}   datecreated Account creation date.
         * @apiSuccess {Object} auth Session information.
         * @apiSuccess {String} auth.token Session token used for future API requests.
         * @apiSuccess {Date}   auth.expires Session expiration.
         * 
         * @apiError {String}   message The reason for the failure.
         * 
         */
        path = 'login'
        app.post(getPath(), auth.login)

        /**
         * @api {post} /auth/refresh Refresh Access Token
         * @apiVersion 1.0.0
         * @apiName refreshUser
         * @apiGroup User
         * 
         * @apiHeader {String} Authorization Access key in form of 'Basic $token'.
         * 
         * @apiSuccess {String} username Username of the user.
         * @apiSuccess {Date}   datecreated Account creation date.
         * @apiSuccess {Object} auth Session information.
         * @apiSuccess {String} auth.token Session token used for future API requests.
         * @apiSuccess {Date}   auth.expires Session expiration.
         * 
         * @apiError {String}   message The reason for the failure.
         * 
         */
        path = 'refresh'
        app.post(getPath(), auth.refresh)

         /**
         * @api {post} /auth/logout Logout
         * @apiVersion 1.0.0
         * @apiName logoutUser
         * @apiGroup User
         * 
         * @apiHeader {String}  Authorization Access key in form of 'Basic $token'.
         * 
         * @apiError {String}   message The reason for the failure.
         * 
         */
        path = 'logout'
        app.post(getPath(), auth.logout)

        /**
         * @api {get} /auth/me  Get User Profile
         * @apiDescription      Can be used to test if session token is valid.
         * @apiVersion 1.0.0
         * @apiName getUser
         * @apiGroup User
         * 
         * @apiHeader {String}  Authorization Access key in form of 'Basic $token'.
         * 
         * @apiSuccess {String} username Username of the user.
         * @apiSuccess {Date}   datecreated Account creation date.
         * 
         * @apiError {String}   message The reason for the failure.
         * 
         */
        path = 'me'
        app.get(getPath(), auth.me)

    // Games Collection Routes
    category = 'games'
    
        path = ''
        app.get(getPath(), games.get)

        path = ''
        app.post(getPath(), games.create)

    // Game Routes
    category = 'games'
        
        path = '/:id'
        app.get(getPath(), game.get)

        path = '/:id'
        app.delete(getPath(), game.remove)

    }

export default routes


