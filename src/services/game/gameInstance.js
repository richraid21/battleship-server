const GameBoard = require('./gameBoard')

class GameInstance {
    constructor(gameService, config = {}){
        if (!gameService)
            throw new Error('Must provide Game Service')
        
        this._gameid = 0
        this._datecreated = null

        this._activePlayer = 0
        this._activePlayerHistory = []
        this._ges = gameService
        
        this._player1 = {
            board: new GameBoard(config)
        }
        this._player2 = {
            board: new GameBoard(config)
        }
    }

    player1() {
        this._activePlayerHistory.push(this._activePlayer)
        this._activePlayer = 1
        
        return this
    }

    player2() {
        this._activePlayerHistory.push(this._activePlayer)
        this._activePlayer = 2
        
        return this
    }

    _requireActivePlayer() {
        if (this._activePlayer !== 1 && this._activePlayer !== 2)
            throw new Error('Must chain player selection to command')
    }

    _requireNewActivePlayer() {
        if (this._activePlayer === this._activePlayerHistory.slice(-1)[0])
            throw new Error('One player cannot take this action consecutively')
    }

    _requireGameState(state) {
        return true
    }

    _checkGameState() {
        const tg = this._targetBoard()
        const maximumHits = tg._board.maxOccupiedNodes
        const totalHits = tg._board.totalHitNodes
        console.log(totalHits, maximumHits)
        
        if (totalHits >= maximumHits)
            this._ges.emit('GAME:OVER', { winner: this._activePlayer })

        return
    }

    _targetPlayer() {
        return this._activePlayer == 1 ? 2 : 1
    }

    _board() {
        return this[`_player${this._activePlayer}`].board
    }

    _targetBoard() {
        return this[`_player${this._targetPlayer()}`].board
    }

    guess(location) {
        this._requireActivePlayer()
        this._requireNewActivePlayer()
        this._requireGameState('INPROGRESS')

        const hitNode = this._targetBoard().guessLocation(location)
        if (hitNode){
            this._ges.emit('GUESS:HIT', hitNode)
        } else {
            this._ges.emit('GUESS:MISS', hitNode)
        }
            

        this._checkGameState()
        return this
    }

    placePiece(name, location) {
        this._requireActivePlayer()
        
        this._board().placePieceOnBoard(name, location)

        return this
    }
}

module.exports = GameInstance