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

        /**
         * @apiDefine GameObject
         * @apiSuccess {Object} game Game Instance information
         * @apiSuccess {Number} game.id id of the game
         * @apiSuccess {String} game.name name of the game
         * @apiSuccess {Date} game.datecreated The date of the game start
         * @apiSuccess {String} game.status status of the game
         * @apiSuccess {Object} game.player1 Player Object
         * @apiSuccess {Object} game.player2 Player Object
         */
    
        /**
         * @api {get} /games  Get All Public Games
         * @apiDescription      Get a listing of all current game sessions
         * @apiVersion 1.0.0
         * @apiName getGames
         * @apiGroup Games
         * 
         * @apiHeader {String}  Authorization Access key in form of 'Basic $token'.
         * 
         * @apiSuccess {Array} games All the current games
         * 
         * @apiError {String}   message The reason for the failure.
         * 
         */
        path = ''
        app.get(getPath(), games.get)

        /**
         * @api {post} /games  Create Game
         * @apiDescription      Create a game
         * @apiVersion 1.0.0
         * @apiName postGames
         * @apiGroup Games
         * 
         * @apiHeader {String}  Authorization Access key in form of 'Basic $token'.
         * 
         * @apiParam {String}   name
         * 
         * @apiUse GameObject
         * 
         * @apiError {String}   message The reason for the failure.
         * 
         */
        path = ''
        app.post(getPath(), games.create)

    // Game Routes
    category = 'games'
        
        /**
         * @api {get} /games/id  Get Game
         * @apiDescription      Get information about a specific game
         * @apiVersion 1.0.0
         * @apiName getGame
         * @apiGroup Games
         * 
         * @apiHeader {String}  Authorization Access key in form of 'Basic $token'.
         *
         * @apiParam {String} gameid The id of the game
         * 
         * @apiUse GameObject
         * 
         * @apiError {String}   message The reason for the failure.
         * 
         */
        path = '/:id'
        app.get(getPath(), game.get)

        /**
         * @api {post} /games/id/join  Join a public Game
         * @apiDescription  Join a publicly listed game. On 200 response, you can now connect with the game socket server at /game/id
         * @apiVersion 1.0.0
         * @apiName joinGame
         * @apiGroup Games
         * 
         * @apiHeader {String}  Authorization Access key in form of 'Basic $token'.
         * 
         * @apiParam {String} gameid The id of the game
         * 
         * @apiUse GameObject
         * 
         * @apiError {String}   message The reason for the failure.
         * 
         */
        path = '/:id/join'
        app.post(getPath(), game.join)

        /**
         * @api {delete} /games/id  Remove Game
         * @apiDescription      Delete specified game
         * @apiVersion 1.0.0
         * @apiName deleteGame
         * @apiGroup Games
         * 
         * @apiHeader {String}  Authorization Access key in form of 'Basic $token'.
         *
         * @apiParam {String} gameid The id of the game
         * 
         * @apiUse GameObject
         * 
         * @apiError {String}   message The reason for the failure.
         * 
         */
        path = '/:id'
        app.del(getPath(), game.remove)

    }

export default routes


